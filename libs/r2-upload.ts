import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand ,ListMultipartUploadsCommand, AbortMultipartUploadCommand  } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


const r2ClientBase = {
  region: 'auto' as const,
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
};

/** Server-side uploads (PutObject with body). */
export const r2Client = new S3Client(r2ClientBase);

/**
 * Presigned URLs only. WHEN_REQUIRED avoids default CRC32 query params (x-amz-checksum-*)
 * that browser PUT uploads cannot satisfy and that complicate R2 CORS.
 */
const r2PresignClient = new S3Client({
  ...r2ClientBase,
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

export const CachePolicy = {
  IMMUTABLE: 'public, max-age=31536000, immutable', // 1 year — product images, videos
  SHORT:     'public, max-age=86400',                // 1 day  — shop logos, banners
  NO_CACHE:  'no-cache, no-store',                   // chat attachments, temp files
} as const;


export async function uploadToR2(
  fileBuffer: Buffer,
  key: string,
  contentType: string = 'image/webp',
  cacheControl: string = CachePolicy.IMMUTABLE

): Promise<{ key: string; url: string }> {
  try {
    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
       CacheControl: cacheControl,

    }));

    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    console.log(`✅ Uploaded to R2: ${key}`);
    return { key, url };
  } catch (error) {
    console.error(`❌ R2 Upload Error (${key}):`, error);
    throw error;
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  try {
    await r2Client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }));
    console.log(`✅ Deleted from R2: ${key}`);
  } catch (error) {
    console.error(`❌ R2 Deletion Error (${key}):`, error);
    throw error;
  }
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  try {
    const response = await r2Client.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }));

    if (!response.Body) {
      throw new Error(`Empty body in R2 download for key: ${key}`);
    }

    // Convert stream to Buffer
    const chunks: any[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error(`❌ R2 Download Error (${key}):`, error);
    throw error;
  }
}

// packages/libs/r2-upload.ts

export async function getR2PresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600  // ← 1 hour instead of 300 seconds
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2PresignClient, command, { expiresIn }); // ← r2PresignClient
}

// Helper function to abort multipart uploads (call this when needed)
export async function abortMultipartUploads(bucketName: string): Promise<void> {
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  try {
    const list = await s3.send(new ListMultipartUploadsCommand({ Bucket: bucketName }));

    for (const upload of list.Uploads ?? []) {
      await s3.send(new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: upload.Key!,
        UploadId: upload.UploadId!,
      }));
      console.log("Aborted:", upload.Key, upload.UploadId);
    }
  } catch (error) {
    console.error("Error aborting multipart uploads:", error);
    throw error;
  }
}
