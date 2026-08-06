import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../../mail/mail.service';

interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

@Injectable()
@Processor('emails', { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger('EmailWorker');

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, template, data } = job.data;
    this.logger.log(`Sending ${template} to ${to}`);
    try {
      await this.mailService.sendMail(to, subject, template, data);
    } catch (error: any) {
      this.logger.error(`Job ${job.id} failed: ${error?.message}`);
      throw error; // trigger BullMQ retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<EmailJobData>) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJobData> | undefined, err: Error) {
    this.logger.error(`Job ${job?.id} failed: ${err.message}`);
  }
}