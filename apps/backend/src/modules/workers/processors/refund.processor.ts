import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Notification } from '../entities/notification.entity';

type RefundJobType =
  | 'REFUND_REQUESTED'
  | 'REFUND_APPROVED'
  | 'REFUND_REJECTED'
  | 'REFUND_COMPLETED';

interface RefundData {
  id?: string;
  userId: string;
  orderId: string;
  amount: number;
  reason?: string;
  adminNotes?: string;
  userName?: string;
  userEmail?: string;
}

interface RefundJob {
  type: RefundJobType;
  data: RefundData;
}

@Injectable()
@Processor('refunds')
export class RefundProcessor extends WorkerHost {
  private readonly logger = new Logger('RefundWorker');

  constructor(
    @InjectQueue('emails') private readonly emailQueue: Queue,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
  ) {
    super();
  }

  private sendEmail(to: string, subject: string, template: string, data: object) {
    return this.emailQueue.add('send-email', { to, subject, template, data });
  }

  private async notify(ref: {
    recipientId: string;
    recipientRole: string;
    title: string;
    message: string;
    redirectLink: string;
    type: string;
  }) {
    await this.notifications.save(
      this.notifications.create(ref as any),
    );
  }

  async process(job: Job<RefundJob>): Promise<void> {
    const { type, data } = job.data;
    const handlers: Record<RefundJobType, () => Promise<void>> = {
      REFUND_REQUESTED: () => this.handleRequested(data),
      REFUND_APPROVED: () => this.handleApproved(data),
      REFUND_REJECTED: () => this.handleRejected(data),
      REFUND_COMPLETED: () => this.handleCompleted(data),
    };
    const handler = handlers[type];
    if (!handler) {
      this.logger.warn(`Unknown refund job type: ${type}`);
      return;
    }
    await handler();
  }

  private async handleRequested(r: RefundData): Promise<void> {
    const [admins, user] = await Promise.all([
      this.users.find({ where: { role: 'admin' }, select: { id: true, name: true, email: true } }),
      r.userId ? this.users.findOne({ where: { id: r.userId } }) : Promise.resolve(null),
    ]);
    const esUnit = 'EGP';

    for (const admin of admins) {
      await this.notify({
        recipientId: admin.id,
        recipientRole: 'ADMIN',
        title: 'New Refund Request',
        message: `${r.userName ?? user?.name ?? 'A user'} requested a refund of ${r.amount ?? ''} ${esUnit} for order #${r.orderId}`,
        redirectLink: `/dashboard/refunds`,
        type: 'USER_REPORT',
      });
      if (admin.email) {
        await this.sendEmail(
          admin.email,
          'New Refund Request - Action Required',
          'refund-requested-admin',
          {
            adminName: admin.name ?? 'Admin',
            userName: r.userName ?? user?.name,
            userEmail: r.userEmail ?? user?.email,
            orderAmount: 0,
            refundAmount: r.amount ?? 0,
            reason: r.reason ?? '',
            orderId: r.orderId,
            refundId: r.id,
          },
        );
      }
    }
  }

  private async handleApproved(data: RefundData): Promise<void> {
    const user = data.userId ? await this.users.findOne({ where: { id: data.userId } }) : null;
    if (!user) return;
    await this.notify({
      recipientId: user.id,
      recipientRole: 'USER',
      title: 'Refund Approved',
      message: `Your refund of ${data.amount} EGP for order #${data.orderId} has been approved`,
      redirectLink: `/profile/orders/${data.orderId}`,
      type: 'ORDER_ISSUE',
    });
    if (user.email) {
      await this.sendEmail(user.email, 'Your Refund Has Been Approved', 'refund-approved-user', {
        userName: user.name || 'Customer',
        refundAmount: data.amount ?? 0,
        orderId: data.orderId,
        reason: data.reason ?? '',
        adminNotes: data.adminNotes ?? '',
      });
    }
  }

  private async handleRejected(data: RefundData): Promise<void> {
    const user = data.userId ? await this.users.findOne({ where: { id: data.userId } }) : null;
    if (!user) return;
    await this.notify({
      recipientId: user.id,
      recipientRole: 'USER',
      title: 'Refund Request Rejected',
      message: `Your refund request for order #${data.orderId} has been rejected`,
      redirectLink: `/profile/orders/${data.orderId}`,
      type: 'ORDER_ISSUE',
    });
    if (user.email) {
      await this.sendEmail(user.email, 'Your Refund Request Has Been Rejected', 'refund-rejected-user', {
        userName: user.name || 'Customer',
        refundAmount: data.amount ?? 0,
        orderId: data.orderId,
        reason: data.reason ?? '',
        adminNotes: data.adminNotes ?? '',
      });
    }
  }

  private async handleCompleted(data: RefundData): Promise<void> {
    const user = data.userId ? await this.users.findOne({ where: { id: data.userId } }) : null;
    if (!user) return;
    await this.notify({
      recipientId: user.id,
      recipientRole: 'USER',
      title: 'Refund Completed',
      message: `Your refund of ${data.amount} EGP for order #${data.orderId} has been sent`,
      redirectLink: `/profile/orders/${data.orderId}`,
      type: 'PAYMENT_SUCCESS',
    });
    if (user.email) {
      await this.sendEmail(user.email, 'Refund Completed', 'refund-completed-user', {
        userName: user.name || 'Customer',
        refundAmount: data.amount ?? 0,
        orderId: data.orderId,
        adminNotes: data.adminNotes ?? '',
      });
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<RefundJob>) {
    this.logger.log(`Refund job completed: ${job.id}, type: ${job.data.type}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<RefundJob> | undefined, err: Error) {
    this.logger.error(`Refund job failed: ${job?.id}, type: ${job?.data?.type}`, err.stack);
  }
}