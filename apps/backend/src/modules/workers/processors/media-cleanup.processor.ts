import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { R2Service } from '../../../common/r2.service';
import { purgeCdnCache } from '../../../common/cdn-purge';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';

interface MediaCleanupJobData {
  productId: string;
  requesterId: string;
  r2Keys: string[];
  r2Urls: string[];
  deletedAt: string;
}

@Injectable()
@Processor('media-cleanup', { concurrency: 3 })
export class MediaCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger('MediaCleanupWorker');

  constructor(
    private readonly r2: R2Service,
    @InjectRepository(AdminAuditLog)
    private readonly auditLogs: Repository<AdminAuditLog>,
  ) {
    super();
  }

  async process(job: Job<MediaCleanupJobData>): Promise<void> {
    const { productId, requesterId, r2Keys, r2Urls, deletedAt } = job.data;

    job.log(`Starting cleanup for product ${productId}: ${r2Keys.length} R2 objects`);

    if (r2Keys.length > 0) {
      await this.r2.deleteMany(r2Keys);
      job.log(`Deleted ${r2Keys.length} R2 objects`);
    }

    if (r2Urls.length > 0) {
      await purgeCdnCache(r2Urls);
      job.log(`Purged ${r2Urls.length} CDN URLs`);
    }

    await this.auditLogs.save(
      this.auditLogs.create({
        action: 'HARD_DELETE_PRODUCT_MEDIA',
        targetId: productId,
        performedBy: requesterId,
        metadata: {
          r2KeysDeleted: r2Keys.length,
          cdnUrlsPurged: r2Urls.length,
          deletedAt,
          completedAt: new Date().toISOString(),
        },
      }),
    );

    job.log(`Cleanup complete for product ${productId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<MediaCleanupJobData> | undefined, err: Error) {
    this.logger.error(`media-cleanup job ${job?.id} failed after all retries: ${err.message}`);
  }
}