import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAnalytics } from '../entities/product-analytics.entity';
import { UserAnalytics } from '../entities/user-analytics.entity';

type UserEventAction =
  | 'add_to_wishlist'
  | 'add_to_cart'
  | 'product_view'
  | 'remove_from_wishlist'
  | 'remove_from_cart'
  | 'shop_visit'
  | 'decrease_cart_quantity'
  | 'clear_cart'
  | 'purchase';

interface UserEvent {
  userId?: string;
  productId?: string;
  action: UserEventAction;
  device?: string;
  city?: string;
}

@Injectable()
@Processor('user-events', { concurrency: 10 })
export class UserEventsProcessor extends WorkerHost {
  private readonly logger = new Logger('UserEventsWorker');

  constructor(
    @InjectRepository(UserAnalytics)
    private readonly userAnalytics: Repository<UserAnalytics>,
    @InjectRepository(ProductAnalytics)
    private readonly productAnalytics: Repository<ProductAnalytics>,
  ) {
    super();
  }

  async process(job: Job<UserEvent>): Promise<void> {
    const event = job.data;
    await this.updateUserAnalytics(event);
    if (event.productId && event.productId !== 'ALL') {
      await this.updateProductAnalytics(event);
    }
  }

  private async updateUserAnalytics(event: UserEvent) {
    if (!event.userId) return;

    const existing = await this.userAnalytics.findOne({
      where: { userId: event.userId },
    });

    let actions: any[] = existing?.actions ?? [];

    const actionEntry = {
      productId: event.productId ?? null,
      action: event.action,
      timeStamp: Date.now(),
      device: event.device ?? null,
    };

    if (event.action === 'product_view') {
      actions.push(actionEntry);
    } else if (['add_to_cart', 'add_to_wishlist'].includes(event.action)) {
      const exists = actions.some(
        (entry: any) =>
          entry.productId === event.productId && entry.action === event.action,
      );
      if (!exists) actions.push(actionEntry);
    } else if (event.action === 'remove_from_cart') {
      actions = actions.filter(
        (entry: any) =>
          !(entry.productId === event.productId && entry.action === 'add_to_cart'),
      );
    } else if (event.action === 'remove_from_wishlist') {
      actions = actions.filter(
        (entry: any) =>
          !(entry.productId === event.productId && entry.action === 'add_to_wishlist'),
      );
    } else if (event.action === 'clear_cart') {
      actions = actions.filter((entry: any) => entry.action !== 'add_to_cart');
    } else {
      actions.push(actionEntry);
    }

    if (actions.length > 100) actions = actions.slice(-100);

    const extra: Partial<UserAnalytics> = {};
    if (event.device) extra.device = event.device;
    if (event.city) extra.city = event.city;

    if (existing) {
      await this.userAnalytics.update(
        { id: existing.id },
        { lastVisited: new Date(), actions, ...extra },
      );
    } else {
      await this.userAnalytics.save(
        this.userAnalytics.create({
          userId: event.userId,
          lastVisited: new Date(),
          actions,
          ...extra,
        }),
      );
    }
  }

  private async updateProductAnalytics(event: UserEvent) {
    if (!event.productId || event.productId === 'ALL') return;

    const updatedFields: Record<string, any> = {};
    if (event.action === 'product_view') {
      updatedFields.views = () => '"views" + 1';
    } else if (event.action === 'add_to_cart') {
      updatedFields.cartAdds = () => '"cartAdds" + 1';
    } else if (event.action === 'add_to_wishlist') {
      updatedFields.wishlistAdds = () => '"wishlistAdds" + 1';
    } else if (event.action === 'remove_from_cart') {
      updatedFields.removeFromCart = () => '"removeFromCart" + 1';
    } else if (event.action === 'remove_from_wishlist') {
      updatedFields.removeFromWishlist = () => '"removeFromWishlist" + 1';
    } else if (event.action === 'purchase') {
      updatedFields.purchases = () => '"purchases" + 1';
    } else if (event.action === 'decrease_cart_quantity') {
      updatedFields.quantityDecreases = () => '"quantityDecreases" + 1';
    }

    const existing = await this.productAnalytics.findOne({
      where: { productId: event.productId },
    });

    if (existing) {
      await this.productAnalytics.update(
        { id: existing.id },
        { lastVisited: new Date(), ...updatedFields },
      );
      return;
    }

    const create: any = {
      productId: event.productId,
      lastVisited: new Date(),
      views: 0,
      cartAdds: 0,
      wishlistAdds: 0,
      removeFromCart: 0,
      removeFromWishlist: 0,
      quantityDecreases: 0,
      purchases: 0,
    };
    if (event.action === 'product_view') create.views = 1;
    else if (event.action === 'add_to_cart') create.cartAdds = 1;
    else if (event.action === 'add_to_wishlist') create.wishlistAdds = 1;
    else if (event.action === 'remove_from_cart') create.removeFromCart = 1;
    else if (event.action === 'remove_from_wishlist') create.removeFromWishlist = 1;
    else if (event.action === 'decrease_cart_quantity') create.quantityDecreases = 1;
    else if (event.action === 'purchase') create.purchases = 1;

    await this.productAnalytics.save(this.productAnalytics.create(create));
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<UserEvent> | undefined, err: Error) {
    this.logger.error(`Job ${job?.id} failed: ${err.message}`);
  }

  @OnWorkerEvent('error')
  onError(err: Error) {
    this.logger.error(`Worker error: ${err.message}`);
  }
}