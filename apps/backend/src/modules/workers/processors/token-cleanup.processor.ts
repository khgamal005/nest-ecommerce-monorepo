import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
@Processor('token-cleanup')
export class TokenCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger('TokenCleanupWorker');

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const result = await this.refreshTokens.delete({
      expiresAt: LessThan(new Date()),
    });
    job.log(`Deleted ${result.affected ?? 0} expired refresh tokens`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error) {
    this.logger.error(`token-cleanup job ${job?.id} failed: ${err.message}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`token-cleanup job ${job.id} completed`);
  }
}