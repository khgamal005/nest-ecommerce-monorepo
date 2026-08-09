import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { RedisService } from '../redis/redis.service';
import { OrdersService } from '../orders/orders.service';
import { User } from '../users/entities/user.entity';
import {
  generateKashierOrderHash,
  verifyKashierHmac,
} from './kashier.hmac';
import {
  OrderStatus,
  PaymentStatus,
  PaymentType,
} from '../orders/entities/order-status.enum';

interface CartLine {
  productId?: string | null;
  variantId?: string | null;
  quantity: number;
  selectedOptions?: any;
  price?: number;
}

export interface PaymentSession {
  sessionId: string;
  userId: string;
  cartHash: string;
  cart: CartLine[];
  totalAmount: number;
  shippingFee: number;
  userEmail: string;
  shippingAddressId?: string;
  phone?: string | null;
  coupon?: any;
  status: string;
  createdAt: number;
  kashier?: { sessionId: string; sessionUrl: string };
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly redis: RedisService,
    private readonly ordersService: OrdersService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  private cartHash(cart: CartLine[]): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(cart))
      .digest('hex');
  }

  private async verifiedCart(cart: CartLine[]) {
    return Promise.all(
      cart.map(async (item) => {
        const price = await this.ordersService.findVariantPrice(item.variantId);
        return { ...item, price };
      }),
    );
  }

  async createPaymentSession(body: {
    cart: CartLine[];
    selectAddressId?: string;
    coupon?: any;
    phone?: string | null;
    shippingFee?: number | string;
  }, userId: string) {
    const { cart, selectAddressId, coupon, phone, shippingFee } = body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    if (shippingFee === undefined || shippingFee === null) {
      throw new BadRequestException('Shipping fee is required');
    }

    const sessionId = crypto.randomUUID();
    const cartHash = this.cartHash(cart);

    // Backend re-verify prices, then compute the final amount (with coupon + shipping).
    const verified = await this.verifiedCart(cart);
    let subtotal = verified.reduce(
      (sum, item) => sum + (item.price ?? 0) * item.quantity,
      0,
    );
    let discountAmount = 0;
    const couponEntity = coupon
      ? await this.ordersService.resolveCoupon(coupon.discount_code)
      : null;
    if (couponEntity) {
      discountAmount =
        couponEntity.discount_type === 'percentage'
          ? subtotal * ((couponEntity.discount_value || 0) / 100)
          : couponEntity.discount_value || 0;
      discountAmount = Math.min(discountAmount, subtotal);
    }
    const totalAmount = Math.max(
      subtotal - discountAmount + Number(shippingFee),
      0,
    );

    const session: PaymentSession = {
      sessionId,
      userId,
      cartHash,
      cart,
      totalAmount,
      shippingFee: Number(shippingFee),
      userEmail: 'customer@example.com',
      shippingAddressId: selectAddressId,
      phone: phone ?? null,
      coupon: coupon ?? null,
      status: 'pending',
      createdAt: Date.now(),
    };

    await this.redis.set(
      `payment-session:${sessionId}`,
      JSON.stringify(session),
      'EX',
      1800,
    );

    return { sessionId };
  }

  async verifyPaymentSession(sessionId: string, userId: string) {
    const raw = await this.redis.get(`payment-session:${sessionId}`);
    if (!raw) {
      return {
        success: false,
        expired: true,
        message: 'Payment session expired or not found',
      };
    }
    const session: PaymentSession = JSON.parse(raw);
    if (session.userId && session.userId !== userId) {
      throw new UnauthorizedException('Unauthorized session access');
    }
    return { success: true, session };
  }

  async createKashierSession(body: { sessionId: string }, userId: string) {
    const { sessionId } = body;
    if (!sessionId) throw new BadRequestException('sessionId is required');

    const raw = await this.redis.get(`payment-session:${sessionId}`);
    if (!raw) throw new BadRequestException('Payment session expired');

    const session: PaymentSession = JSON.parse(raw);
    if (session.userId && session.userId !== userId) {
      throw new UnauthorizedException('Unauthorized payment session');
    }
    if (session.status !== 'pending') {
      throw new BadRequestException('Payment session already processed');
    }

    if (session.kashier?.sessionUrl) {
      return {
        success: true,
        sessionUrl: session.kashier.sessionUrl,
        alreadyCreated: true,
      };
    }

    const amount = session.totalAmount.toFixed(2);
    const currency = 'EGP';
    const merchantId = process.env.KASHIER_MERCHANT_ID;
    const apiKey = process.env.KASHIER_PAYMENT_API_KEY;

    if (!merchantId || !apiKey) {
      throw new BadRequestException('Kashier API keys not configured');
    }

    const mode = process.env.KASHIER_MODE === 'test' ? 'test' : 'live';
    const merchantRedirect = `${process.env.API_BASE_URL}/payments/kashier/redirect-callback`;
    const serverWebhook = `${process.env.API_BASE_URL}/payments/kashier/webhook-callback`;

    const hash = generateKashierOrderHash(
      merchantId,
      sessionId,
      amount,
      currency,
    );

    const params = new URLSearchParams({
      merchantId,
      orderId: sessionId,
      amount,
      currency,
      mode,
      hash,
      merchantRedirect,
      serverWebhook,
    });

    const sessionUrl = `https://checkout.kashier.io?${params.toString()}`;

    session.kashier = { sessionId, sessionUrl };
    await this.redis.set(
      `payment-session:${sessionId}`,
      JSON.stringify(session),
      'EX',
      600,
    );

    return { success: true, sessionUrl };
  }

  async kashierWebhookCreateOrder(raw: any) {
    const { verified, data } = verifyKashierHmac(raw);
    if (!verified) {
      return { statusCode: 401 };
    }

    const transactionId = data.transactionId;
    const processedKey = `kashier:processed:${transactionId}`;
    const lockKey = `kashier:lock:${transactionId}`;

    const lockAcquired = await this.redis.setnx(lockKey, '1', 30);
    if (!lockAcquired) {
      return { statusCode: 200, message: 'locked' };
    }

    try {
      if (await this.redis.get(processedKey)) {
        return { statusCode: 200 };
      }

      if (data.status !== 'SUCCESS') {
        return { statusCode: 200 };
      }

      const sessionId = data.merchantOrderId;
      const sessionRaw = await this.redis.get(`payment-session:${sessionId}`);
      if (!sessionRaw) {
        await this.redis.set(processedKey, 'true', 'EX', 86400);
        return { statusCode: 200 };
      }

      const session: PaymentSession = JSON.parse(sessionRaw);
      const { cart, userId, shippingAddressId, coupon, phone, shippingFee } =
        session;

      const user = await this.users.findOne({ where: { id: userId } });
      if (!user || !user.email) {
        await this.redis.set(processedKey, 'true', 'EX', 86400);
        return { statusCode: 200 };
      }

      const verified = await this.verifiedCart(cart);
      const couponEntity = coupon
        ? await this.ordersService.resolveCoupon(coupon.discount_code)
        : null;

      const order = await this.ordersService.createOrder({
        cart,
        userId,
        shippingAddressId: shippingAddressId ?? null,
        phone: phone ?? null,
        coupon: couponEntity,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentType: PaymentType.KASHIER,
        paymentSessionId: sessionId,
        shippingFee: shippingFee,
      });

      await this.redis.set(processedKey, 'true', 'EX', 86400);
      await this.redis.del(`payment-session:${sessionId}`);

      await this.ordersService.enqueuePostProcess({
        type: 'PAID',
        orders: [{ id: order.id, total: order.total }],
        items: verified,
        userId,
        shippingAddressId,
        coupon,
        totalAmount: session.totalAmount,
        sessionId,
      });

      return { statusCode: 200 };
    } finally {
      await this.redis.del(lockKey);
    }
  }

  async createCODOrder(body: {
    cart: CartLine[];
    selectAddressId?: string;
    coupon?: any;
    phone?: string | null;
    userId: string;
    shippingFee?: number | string;
  }) {
    const { cart, selectAddressId, coupon, phone, userId, shippingFee } = body;

    if (!userId) throw new BadRequestException('User ID is required');
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    if (!selectAddressId) {
      throw new BadRequestException('Shipping address is required');
    }
    if (shippingFee === undefined || shippingFee === null) {
      throw new BadRequestException('Shipping fee is required');
    }

    const verified = await this.verifiedCart(cart);
    const couponEntity = coupon
      ? await this.ordersService.resolveCoupon(coupon.discount_code)
      : null;

    const order = await this.ordersService.createOrder({
      cart,
      userId,
      shippingAddressId: selectAddressId,
      phone: phone ?? null,
      coupon: couponEntity,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentType: PaymentType.COD,
      shippingFee: Number(shippingFee),
    });

    await this.ordersService.enqueuePostProcess({
      type: 'COD',
      orders: [{ id: order.id, total: order.total }],
      items: verified,
      userId,
      shippingAddressId: selectAddressId,
      coupon,
      totalAmount: order.total,
      sessionId: null,
    });

    return {
      success: true,
      message: 'COD order created successfully',
      orderId: order.id,
      order: { id: order.id, total: order.total, status: order.status },
    };
  }

  async kashierRedirectUser(query: any) {
    const { transactionId, merchantOrderId } = query;
    return `${process.env.FRONTEND_URL}/success?sessionId=${merchantOrderId}&transactionId=${transactionId}`;
  }
}