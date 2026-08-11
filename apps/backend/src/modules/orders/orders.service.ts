import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import {
  OrderStatus,
  PaymentStatus,
  PaymentType,
} from './entities/order-status.enum';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { Coupon } from '../promotions/entities/coupon.entity';
import { RedisService } from '../redis/redis.service';

interface CartLine {
  productId?: string | null;
  variantId?: string | null;
  quantity: number;
  selectedOptions?: any;
  price?: number;
}

export interface CreateOrderOptions {
  cart: CartLine[];
  userId: string;
  shippingAddressId?: string | null;
  phone?: string | null;
  coupon?: Coupon | null;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentType?: PaymentType | null;
  paymentSessionId?: string | null;
  shippingFee?: number;
}

const SHIPPING_FEE_EGP = 50;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Coupon)
    private readonly coupons: Repository<Coupon>,
    private readonly redis: RedisService,
    private readonly dataSource: DataSource,
    @InjectQueue('order-post-process')
    private readonly orderQueue: Queue,
  ) {}

  async resolveCoupon(code?: string | null): Promise<Coupon | null> {
    if (!code) return null;
    return (await this.coupons.findOne({ where: { discount_code: code } })) ?? null;
  }

  async findVariantPrice(variantId?: string | null): Promise<number> {
    if (!variantId) return 0;
    const variant = await this.variants.findOne({ where: { id: variantId } });
    if (!variant) return 0;
    const price = Number(variant.price);
    const salePrice = variant.salePrice ? Number(variant.salePrice) : null;
    const now = new Date();
    const hasTimedSale =
      variant.salePrice && !!variant.starting_date && !!variant.ending_date;
    const start = variant.starting_date ? new Date(variant.starting_date) : null;
    const end = variant.ending_date ? new Date(variant.ending_date) : null;
    const isSaleActive = hasTimedSale && start && end
      ? now >= start && now <= end
      : salePrice != null;
    return isSaleActive && salePrice != null ? salePrice : price;
  }

  async getOrderStatus(sessionId: string) {
    const existingKey = await this.redis.get(`payment-session:${sessionId}`);
    if (existingKey) return { status: 'PENDING' };

    const order = await this.orders.findOne({
      where: { paymentSessionId: sessionId },
    });
    if (!order) return { status: 'PROCESSING' };

    return { status: order.status, orderIds: [order.id] };
  }

  async createOrder(opts: CreateOrderOptions): Promise<Order> {
    const { cart, userId } = opts;
    if (!cart || cart.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Backend re-verify prices
    const items: {
      productId?: string | null;
      variantId?: string | null;
      quantity: number;
      selectedOptions?: any;
      price: number;
    }[] = await Promise.all(
      cart.map(async (item) => {
        const price = await this.findVariantPrice(item.variantId);
        return {
          productId: item.productId ?? null,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          price,
          selectedOptions: item.selectedOptions,
        };
      }),
    );

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    let discountAmount = 0;
    if (opts.coupon) {
      const coupon = opts.coupon;
      discountAmount =
        coupon.discount_type === 'percentage'
          ? subtotal * ((coupon.discount_value || 0) / 100)
          : coupon.discount_value || 0;
      discountAmount = Math.min(discountAmount, subtotal);
    }

    const shippingFee = opts.shippingFee ?? SHIPPING_FEE_EGP;
    const total = Math.max(subtotal - discountAmount + shippingFee, 0);

    const order = await this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(
        manager.create(Order, {
          userId,
          total,
          status: opts.status ?? OrderStatus.PENDING,
          paymentStatus: opts.paymentStatus ?? PaymentStatus.PENDING,
          paymentType: opts.paymentType ?? null,
          paymentSessionId: opts.paymentSessionId ?? null,
          shippingAddressId: opts.shippingAddressId ?? null,
          phone: opts.phone ?? null,
          couponCode: opts.coupon?.discount_code ?? null,
          discountAmount: discountAmount > 0 ? discountAmount : null,
          shippingFee,
        }),
      );

      const itemsToSave = items.map((item) =>
        manager.create(OrderItem, {
          orderId: saved.id,
          productId: item.productId ?? null,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          price: item.price,
          selectedOptions: item.selectedOptions ?? null,
        }),
      );
      await manager.save(itemsToSave);

      const created = await manager.findOne(Order, {
        where: { id: saved.id },
        relations: ['items'],
      });
      return created as Order;
    });

    return order;
  }

  async getUserOrders(userId: string) {
    const orders = await this.orders.find({
      where: { userId },
      relations: ['items', 'items.product', 'items.variant', 'refunds'],
      order: { createdAt: 'DESC' },
    });
    return { success: true, orders, count: orders.length };
  }

  async getAdminOrders() {
    const orders = await this.orders.find({
      relations: ['items', 'items.product', 'items.variant', 'user', 'refunds'],
      order: { createdAt: 'DESC' },
    });
    return orders.map((order: any) => ({
      ...order,
      user: order.user
        ? { id: order.user.id, name: order.user.name, email: order.user.email }
        : null,
    }));
  }

  async getOrderById(orderId: string) {
    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.variant.images',
        'items.variant.optionValues',
        'items.variant.optionValues.optionValue',
        'items.variant.optionValues.optionValue.option',
        'user',
        'refunds',
      ],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.items) {
      order.items = order.items.filter((item) => item.product !== null);
    }
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    body: {
      status?: OrderStatus;
      deliveryStatus?: string;
      paymentStatus?: PaymentStatus;
    },
    _actorRole: string,
  ) {
    const { status, deliveryStatus, paymentStatus } = body;
    if (!status && !deliveryStatus && !paymentStatus) {
      throw new BadRequestException('Please provide a status to update');
    }

    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');

    const updateData: Partial<Order> = {};
    if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    await this.orders.update(orderId, updateData);
    return { success: true, orderId };
  }

  async cancelOrder(
    orderId: string,
    userId: string,
    userRole: string,
    reason?: string,
  ) {
    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');

    if (userRole === 'user' && order.userId !== userId) {
      throw new BadRequestException('Unauthorized to cancel this order');
    }

    if (['SHIPPED', 'DELIVERED', 'CANCELED'].includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order with status: ${order.status}`,
      );
    }

    await this.orders.update(orderId, {
      status: OrderStatus.CANCELED,
      deliveryStatus: 'cancelled',
      cancelReason: reason || 'No reason provided',
      cancelledBy: userRole,
    });

    const items = order.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
    }));

    await this.enqueueGuard(() =>
      this.orderQueue.add(
        'order-cancelled',
        {
          orderId,
          userId,
          items,
          reason: reason || 'No reason provided',
          cancelledBy: userRole,
          type: 'CANCELED',
          sessionId: `cancel-${orderId}`,
        },
        {
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      ),
    );

    return { success: true, orderId };
  }

  async enqueuePostProcess(data: any) {
    await this.enqueueGuard(() =>
      this.orderQueue.add(
        'post-process',
        data,
        {
          removeOnComplete: true,
          removeOnFail: 500,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      ),
    );
  }

  // BullMQ requires Redis >= 5. When WORKERS_ENABLED=false the queues are
  // intentionally off, so skip enqueuing (and any Redis error) instead of
  // breaking the primary order workflow.
  private async enqueueGuard(operation: () => Promise<unknown>): Promise<void> {
    if ((process.env.WORKERS_ENABLED ?? 'true') === 'false') {
      return;
    }
    try {
      await operation();
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.warn(
        `[orders] queue enqueue skipped (Redis unavailable?): ${e?.message ?? e}`,
      );
    }
  }
}