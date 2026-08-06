import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { R2Service } from '../../../common/r2.service';
import { ProductVideo } from '../../products/entities/product-video.entity';

const MAX_SIZE_BYTES = Number(process.env.VIDEO_MAX_SIZE_BYTES) || 10 * 1024 * 1024;
const MAX_DURATION_SEC = Number(process.env.VIDEO_MAX_DURATION_SEC) || 30;
const VIDEO_JOB_TIMEOUT_MS = Number(process.env.VIDEO_JOB_TIMEOUT_MS) || 5 * 60 * 1000;

interface VideoJobData {
  filePath?: string;
  rawKey?: string;
  videoId: string;
  productId?: string;
  productVariantId?: string;
}

function getVideoMeta(filePath: string): Promise<{ duration: number; size: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve({
        duration: data.format.duration ?? 0,
        size: data.format.size ?? 0,
      });
    });
  });
}

function compressVideo(
  inputPath: string,
  outputPath: string,
  durationSec: number,
): Promise<void> {
  const audioBytes = (64_000 * durationSec) / 8;
  const videoBytes = 6 * 1024 * 1024 - audioBytes;
  const maxRateKbps = Math.floor((videoBytes * 8) / durationSec / 1000);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-crf 28',
        `-maxrate ${maxRateKbps}k`,
        `-bufsize ${maxRateKbps * 2}k`,
        '-preset fast',
        '-c:a aac',
        '-b:a 64k',
        '-movflags +faststart',
        '-vf scale=-2:720',
      ])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

async function cleanup(...paths: string[]) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {
      console.warn('[VIDEO-WORKER] Cleanup failed for:', p, e);
    }
  }
}

@Injectable()
@Processor('video-processing', { concurrency: 3, lockDuration: VIDEO_JOB_TIMEOUT_MS })
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger('VideoWorker');

  constructor(
    private readonly r2: R2Service,
    @InjectRepository(ProductVideo)
    private readonly productVideos: Repository<ProductVideo>,
  ) {
    super();
  }

  async process(job: Job<VideoJobData>) {
    let { filePath, rawKey, videoId } = job.data;
    const outputPath = path.join(os.tmpdir(), `out-${videoId}.mp4`);
    const downloadPath = path.join(os.tmpdir(), `raw-${videoId}.tmp`);

    try {
      if (rawKey) {
        const rawBuffer = await this.r2.download(rawKey);
        await fs.promises.writeFile(downloadPath, rawBuffer);
        filePath = downloadPath;
      }

      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error(`Video file not found: ${filePath}`);
      }

      const { duration } = await getVideoMeta(filePath);

      if (duration > MAX_DURATION_SEC) {
        throw new Error(`Video too long: ${duration.toFixed(1)}s (max ${MAX_DURATION_SEC}s)`);
      }
      if (duration === 0) {
        throw new Error('Could not determine video duration — file may be corrupt');
      }

      await job.updateProgress(10);
      await compressVideo(filePath, outputPath, duration);
      await job.updateProgress(60);

      const { size: outputSize } = fs.statSync(outputPath);
      if (outputSize > MAX_SIZE_BYTES) {
        throw new Error(
          `Compressed video still exceeds 10MB (${(outputSize / 1024 / 1024).toFixed(1)}MB)`,
        );
      }

      const r2Key = `products/videos/${videoId}.mp4`;
      const outputBuffer = await fs.promises.readFile(outputPath);
      const { url } = await this.r2.upload(outputBuffer, r2Key, 'video/mp4');
      await job.updateProgress(90);

      if (job.data.productId) {
        await this.productVideos.save(
          this.productVideos.create({
            url,
            r2_key: r2Key,
            mime_type: 'video/mp4',
            size_bytes: outputSize,
            productId: job.data.productId,
            productVariantId: job.data.productVariantId ?? null,
          }),
        );
      }

      await job.updateProgress(100);
      return { url, r2Key, size: outputSize };
    } finally {
      await cleanup(filePath!, outputPath, downloadPath);
      if (rawKey) {
        await this.r2.deleteSingle(rawKey).catch((e) =>
          this.logger.warn(`Failed to delete raw file from R2: ${e}`),
        );
      }
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<VideoJobData>) {
    this.logger.log(`Job ${job.id} done`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<VideoJobData> | undefined, err: Error) {
    this.logger.error(`Job ${job?.id} failed: ${err.message}`);
  }
}