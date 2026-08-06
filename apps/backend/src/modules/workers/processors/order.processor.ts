import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../redis/redis.service';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductAnalytics } from '../entities/product-analytics.entity';
import { UserAnalytics } from '../entities/user-analytics.entity';
import { User } from '../../users/entities/user.entity';
import { Notification } from '../entities/notification.entity';

interface OrderItem {
  productId?: string;
  id?: string;
  variantId?: string;
  quantity: number;
}

interface OrderPostProcessJob {
  type: 'PAID' | 'COD' | 'CANCELED';
  orders?: { id: string; total: number }[];
  items?: OrderItem[];
  userId: string;
  shippingAddressId?: string;
  totalAmount?: number;
  sessionId: string;
  orderId?: string;
  cancelledBy?: 'user' | 'seller' | 'admin';
  reason?: string;
}

@Injectable()
@Processor('order-post-process', { concurrency: 3 })
export class OrderPostProcessProcessor extends WorkerHost {
  private readonly logger = new Logger('OrderWorker');

  constructor(
    private readonly redis: RedisService,
    @InjectQueue('emails') private readonly emailQueue: Queue,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(ProductAnalytics)
    private readonly productAnalytics: Repository<ProductAnalytics>,
    @InjectRepository(UserAnalytics)
    private readonly userAnalytics: Repository<UserAnalytics>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
  ) {
    super();
  }

  async process(job: Job<OrderPostProcessJob>): Promise<void> {
    const { type, sessionId } = job.data;

    if (type === 'PAID' || type === 'COD') {
      if (sessionId) {
        const alreadyProcessed = await this.redis.get(`worker:processed:${sessionId}`);
        if (alreadyProcessed) {
          this.logger.log(`Job ${job.id} already processed (sessionId: ${sessionId}), skipping`);
          return;
        }
      }
    }

    this.logger.log(`Processing ${type} job: ${job.id}`);

    if (type === 'PAID' || type === 'COD') {
      await this.handlePaidOrCOD(job.data);
      if (sessionId) {
        await this.redis.set(`worker:processed:${sessionId}`, '1', 'EX', 86400);
      }
    } else if (type === 'CANCELED') {
      await this.handleOrderCancelled(job.data);
    }

    this.logger.log(`Job ${job.id} fully processed`);
  }

  private async publishAdminNotifications(
    title: string,
    message: string,
    redirectLink: string,
    type: string,
    creatorId?: string,
  ) {
    const admins = await this.users.find({
      where: { role: 'admin' },
      select: { id: true },
    });
    if (!admins.length) return;
    await this.notifications.save(
      admins.map((a) =>
        this.notifications.create({
          recipientId: a.id,
          recipientRole: 'ADMIN',
          title,
          message,
          redirectLink,
          type,
          isRead: false,
          creatorId: creatorId ?? null,
        }),
      ),
    );
  }

  private async handlePaidOrCOD(
    data: OrderPostProcessJob,
  ): Promise<void> {
    const { orders, items, userId, totalAmount } = data;
    if (!orders || !items || !totalAmount) return;
    const isCOD = data.type === 'COD';
    const orderType = isCOD ? 'COD' : 'online payment';

    const user = await this.users.findOne({ where: { id: userId } });

    for (const order of orders) {
      await this.publishAdminNotifications(
        `New ${orderType} Order`,
        `New ${isCOD ? 'Cash on Delivery' : 'online payment'} order received. Order ID: ${order.id}. Total: ${order.total.toFixed(2)}`,
        `${process.env.FRONTEND_URL_ADMIN_UI}/dashboard/orders/${order.id}`,
        'NEW_ORDER',
        userId,
      );
    }

    await this.products.manager.transaction(async (tx) => {
      for (const item of items) {
        const productId = item.productId || item.id;
        const variantId = item.variantId;

        if (variantId) {
          await tx.update(ProductVariant, { id: variantId }, { stock: () => `stock - ${item.quantity}` });
          await tx.update(Product, { id: productId }, { totalSales: () => `"totalSales" + ${item.quantity}` });
        } else {
          const defaultVariant = await tx.findOne(ProductVariant, {
            where: { productId },
            select: { id: true },
          });
          if (defaultVariant) {
            await tx.update(ProductVariant, { id: defaultVariant.id }, { stock: () => `stock - ${item.quantity}` });
            await tx.update(Product, { id: productId }, { totalSales: () => `"totalSales" + ${item.quantity}` });
          } else {
            await tx.update(Product, { id: productId }, { totalSales: () => `"totalSales" + ${item.quantity}` });
          }
        }

        const existing = await tx.findOne(ProductAnalytics, { where: { productId } });
        if (existing) {
          await tx.update(ProductAnalytics, { id: existing.id }, {
            purchases: () => `"purchases" + ${item.quantity}`,
            lastVisited: new Date(),
          });
        } else {
          await tx.save(ProductAnalytics, tx.create(ProductAnalytics, {
            productId,
            purchases: item.quantity,
            lastVisited: new Date(),
          }));
        }
      }
    });

    if (userId) {
      const existingUserAnalytics = await this.userAnalytics.findOne({ where: { userId } });
      const entry = {
        productId: items.map((i) => i.productId || i.id),
        action: 'purchase',
        timestamp: new Date(),
      };
      if (existingUserAnalytics) {
        const actions = [...(existingUserAnalytics.actions ?? []), entry];
        await this.userAnalytics.update({ id: existingUserAnalytics.id }, { lastVisited: new Date(), actions });
      } else {
        await this.userAnalytics.save(
          this.userAnalytics.create({
            userId,
            actions: [entry],
            lastVisited: new Date(),
          }),
        );
      }
    }

    if (user?.email) {
      await this.emailQueue.add('send-email', {
        to: user.email,
        subject: `Order Confirmation – Mahawed${isCOD ? ' (COD)' : ' (online payment)'}`,
        template: 'order-confirmation',
        data: {
          name: user.name || 'Customer',
          orderId: orders.map((o) => o.id).join(', '),
          totalAmount: totalAmount.toFixed(2),
          trackingUrl: `${process.env.FRONTEND_URL}/profile?tab=Orders`,
        },
      });
    }
  }

  private async handleOrderCancelled(data: OrderPostProcessJob): Promise<void> {
    const { orderId, cancelledBy, reason, userId, items } = data;
    if (!orderId || !items) return;

    for (const item of items) {
      const productId = item.productId || item.id;
      const variantId = item.variantId;

      if (variantId) {
        await this.products.manager.transaction(async (tx) => {
          await tx.update(ProductVariant, { id: variantId }, { stock: () => `stock + ${item.quantity}` });
          await tx.update(Product, { id: productId }, { totalSales: () => `"totalSales" - ${item.quantity}` });
        });
      } else {
        const defaultVariant = await this.variants.findOne({ where: { productId }, select: { id: true } });
        if (defaultVariant) {
          await this.products.manager.transaction(async (tx) => {
            await tx.update(ProductVariant, { id: defaultVariant.id }, { stock: () => `stock + ${item.quantity}` });
            await tx.update(Product, { id: productId }, { totalSales: () => `"totalSales" - ${item.quantity}` });
          });
        }
      }

      const existing = await this.productAnalytics.findOne({ where: { productId } });
      if (existing) {
        await this.productAnalytics.update({ id: existing.id }, {
          purchases: () => `"purchases" - ${item.quantity}`,
          lastVisited: new Date(),
        });
      }
    }

    const [user, admins] = await Promise.all([
      userId ? this.users.findOne({ where: { id: userId } }) : Promise.resolve(null),
      this.users.find({ where: { role: 'admin' }, select: { id: true, name: true, email: true } }),
    ]);

    const cancelledByLabel =
      cancelledBy === 'user' ? 'the customer' : cancelledBy === 'seller' ? 'the seller' : 'an admin';

    if (user) {
      await this.notifications.save(
        this.notifications.create({
          recipientId: user.id,
          recipientRole: 'USER',
          title: 'Order Cancelled',
          message: `Your order #${orderId} was cancelled. Reason: ${reason}`,
          redirectLink: `${process.env.FRONTEND_URL}/profile/orders/${orderId}`,
          type: 'ORDER_ISSUE',
        }),
      );
      if (user.email) {
        await this.emailQueue.add('send-email', {
          to: user.email,
          subject: `Order Cancelled - #${orderId}`,
          template: 'order-cancelled-user',
          data: {
            name: user.name || 'Customer',
            orderId,
            cancelledBy: cancelledByLabel,
            reason,
            shopName: 'Mahawed Shop',
          },
        });
      }
    }

    for (const admin of admins) {
      await this.notifications.save(
        this.notifications.create({
          recipientId: admin.id,
          recipientRole: 'ADMIN',
          title: 'Order Cancelled',
          message: `Order #${orderId} was cancelled. Reason: ${reason ?? '-'}`,
          redirectLink: `${process.env.FRONTEND_URL_ADMIN_UI}/dashboard/orders/${orderId}`,
          type: 'ORDER_ISSUE',
          creatorId: userId ?? null,
        }),
      );
      if (admin.email) {
        await this.emailQueue.add('send-email', {
          to: admin.email,
          subject: 'Order Cancelled - Action Required',
          template: 'order-cancelled-admin',
          data: {
            adminName: admin.name ?? 'Admin',
            orderId,
            cancelledBy: cancelledByLabel,
            userName: user?.name,
            reason,
          },
        });
      }
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<OrderPostProcessJob>) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<OrderPostProcessJob> | undefined, err: Error) {
    this.logger.error(`Job ${job?.id} failed: ${err.message}`);
  }
}