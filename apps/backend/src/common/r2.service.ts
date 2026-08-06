import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  ListMultipartUploadsCommand,
  AbortMultipartUploadCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Mirror of libs/r2-upload.ts — R2 (S3-compatible) media helpers.
 * Instantiated as an injectable so the backend build stays inside src/.
 */
@Injectable()
export class R2Service {
  constructor(private readonly configService: ConfigService) {}

  private get client(): S3Client {
    return new S3Client({
      region: 'auto',
      endpoint: this.configService.get<string>('R2_ENDPOINT')!,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY')!,
      },
    });
  }

  private get presignClient(): S3Client {
    return new S3Client({
      region: 'auto',
      endpoint: this.configService.get<string>('R2_ENDPOINT')!,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY')!,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
  }

  private get bucket(): string {
    return this.configService.get<string>('R2_BUCKET_NAME')!;
  }

  public get publicUrl(): string {
    return this.configService.get<string>('R2_PUBLIC_URL') ?? '';
  }

  async upload(
    fileBuffer: Buffer,
    key: string,
    contentType = 'image/webp',
    cacheControl = 'public, max-age=31536000, immutable',
  ): Promise<{ key: string; url: string }> {
    const r2 = this.client;
    await r2.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        CacheControl: cacheControl,
      }),
    );
    const url = `${this.publicUrl}/${key}`;
    return { key, url };
  }

  async deleteSingle(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async deleteMany(keys: string[]): Promise<void> {
    const batches = chunk(keys, 1000);
    for (const batch of batches) {
      const result = await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: false },
        }),
      );
      if (result.Errors?.length) {
        throw new Error(
          `R2 partial failure: ${result.Errors.map((e) => e.Key).join(', ')}`,
        );
      }
    }
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!response.Body) {
      throw new Error(`Empty body in R2 download for key: ${key}`);
    }
    const chunks: any[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.presignClient, command, { expiresIn });
  }

  /**
   * Iterates over objects under a prefix, invoking onPage for each page of keys.
   * Returns the total number of objects found.
   */
  async listAllKeys(
    prefix: string,
    onPage: (keys: string[]) => Promise<void>,
  ): Promise<number> {
    let continuationToken: string | undefined = undefined;
    let totalKeys = 0;
    do {
      const result: any = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      if (result.Contents) {
        const pageKeys = result.Contents.map((obj: any) => obj.Key!);
        totalKeys += pageKeys.length;
        await onPage(pageKeys);
      }
      continuationToken = result.NextContinuationToken;
    } while (continuationToken);
    return totalKeys;
  }

  async abortMultipartUploads(): Promise<void> {
    const list = await this.client.send(
      new ListMultipartUploadsCommand({ Bucket: this.bucket }),
    );
    for (const upload of list.Uploads ?? []) {
      await this.client.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: upload.Key!,
          UploadId: upload.UploadId!,
        }),
      );
    }
  }
}

export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}