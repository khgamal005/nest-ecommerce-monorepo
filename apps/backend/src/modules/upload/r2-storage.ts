import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

let cachedClient: S3Client | null = null;

function getR2Client(): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    });
  }
  return cachedClient;
}

export async function uploadToR2(
  fileBuffer: Buffer,
  key: string,
  contentType: string,
): Promise<{ key: string; url: string }> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!bucket || !publicUrl) {
    throw new Error('R2 storage is not configured (R2_BUCKET_NAME / R2_PUBLIC_URL)');
  }

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return { key, url: `${publicUrl}/${key}` };
}

export async function deleteFromR2(key: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('R2 storage is not configured (R2_BUCKET_NAME)');
  }

  await getR2Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}