import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { RefundService } from './refund.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Refund } from './entities/refund.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { Coupon } from '../promotions/entities/coupon.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Refund,
      Product,
      ProductVariant,
      User,
      Coupon,
    ]),
    BullModule.registerQueue({ name: 'order-post-process' }),
    BullModule.registerQueue({ name: 'refunds' }),
    RedisModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, RefundService],
  exports: [OrdersService, RefundService],
})
export class OrdersModule {}