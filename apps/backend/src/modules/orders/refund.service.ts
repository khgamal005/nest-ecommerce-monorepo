import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Refund } from './entities/refund.entity';
import { RefundStatus } from './entities/refund-status.enum';
import { Order } from './entities/order.entity';
import { PaymentStatus } from './entities/order-status.enum';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(Refund)
    private readonly refunds: Repository<Refund>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectQueue('refunds')
    private readonly refundQueue: Queue,
  ) {}

  async requestRefund(data: {
    orderId: string;
    userId: string;
    amount: number;
    reason: string;
    userNotes?: string;
  }) {
    const { orderId, userId, amount, reason, userNotes } = data;
    if (!orderId || !amount || !reason) {
      throw new BadRequestException('orderId, amount, and reason are required');
    }

    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      throw new BadRequestException('Order does not belong to this user');
    }

    const refund = await this.refunds.save(
      this.refunds.create({
        orderId,
        userId,
        amount: Number(amount),
        reason,
        userNotes: userNotes ?? null,
        status: RefundStatus.PENDING,
        paymentSessionId: order.paymentSessionId,
      }),
    );

    await this.refundQueue.add('REFUND_REQUESTED', {
      data: {
        id: refund.id,
        userId,
        orderId,
        amount: Number(amount),
        reason,
      },
    });

    return refund;
  }

  async approveRefund(id: string, adminId: string, adminNotes?: string) {
    const refund = await this.refunds.findOne({ where: { id } });
    if (!refund) throw new NotFoundException('Refund not found');

    refund.status = RefundStatus.APPROVED;
    refund.adminId = adminId;
    refund.adminNotes = adminNotes ?? null;
    refund.reviewedAt = new Date();
    await this.refunds.save(refund);

    await this.refundQueue.add('REFUND_APPROVED', {
      data: {
        id: refund.id,
        userId: refund.userId,
        orderId: refund.orderId,
        amount: refund.amount,
        reason: refund.reason,
        adminNotes,
      },
    });

    return refund;
  }

  async rejectRefund(id: string, adminId: string, adminNotes: string) {
    if (!adminNotes) {
      throw new BadRequestException('Admin notes are required for rejection');
    }
    const refund = await this.refunds.findOne({ where: { id } });
    if (!refund) throw new NotFoundException('Refund not found');

    refund.status = RefundStatus.REJECTED;
    refund.adminId = adminId;
    refund.adminNotes = adminNotes;
    refund.reviewedAt = new Date();
    await this.refunds.save(refund);

    await this.refundQueue.add('REFUND_REJECTED', {
      data: {
        id: refund.id,
        userId: refund.userId,
        orderId: refund.orderId,
        amount: refund.amount,
        reason: refund.reason,
        adminNotes,
      },
    });

    return refund;
  }

  async completeRefund(id: string, adminId: string, adminNotes?: string) {
    const refund = await this.refunds.findOne({ where: { id } });
    if (!refund) throw new NotFoundException('Refund not found');

    refund.status = RefundStatus.COMPLETED;
    refund.adminId = adminId;
    refund.adminNotes = adminNotes ?? null;
    refund.processedAt = new Date();
    refund.completedAt = new Date();
    await this.refunds.save(refund);

    await this.orders.update(refund.orderId, {
      paymentStatus: PaymentStatus.REFUNDED,
    });

    await this.refundQueue.add('REFUND_COMPLETED', {
      data: {
        id: refund.id,
        userId: refund.userId,
        orderId: refund.orderId,
        amount: refund.amount,
        reason: refund.reason,
        adminNotes,
      },
    });

    return refund;
  }

  async getAllRefunds(options: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { status, page = 1, limit = 20, search } = options;

    const qb = this.refunds
      .createQueryBuilder('refund')
      .leftJoinAndSelect('refund.order', 'order')
      .leftJoinAndSelect('refund.user', 'user')
      .orderBy('refund.createdAt', 'DESC');

    if (status) qb.andWhere('refund.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(refund.id ILIKE :search OR order.id ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.skip((page - 1) * limit).take(limit);
    const [refunds, total] = await qb.getManyAndCount();

    return { refunds, total, page, limit };
  }

  async getRefundStats() {
    const [pending, approved, completed, rejected, total] = await Promise.all([
      this.refunds.count({ where: { status: RefundStatus.PENDING } }),
      this.refunds.count({ where: { status: RefundStatus.APPROVED } }),
      this.refunds.count({ where: { status: RefundStatus.COMPLETED } }),
      this.refunds.count({ where: { status: RefundStatus.REJECTED } }),
      this.refunds.count(),
    ]);
    return { total, pending, approved, completed, rejected };
  }

  async getUserRefunds(userId: string, page = 1, limit = 10) {
    const [refunds, total] = await this.refunds.findAndCount({
      where: { userId },
      relations: ['order'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { refunds, total, page, limit };
  }
}