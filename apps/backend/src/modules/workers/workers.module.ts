import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MailModule } from '../mail/mail.module';
import { RedisModule } from '../redis/redis.module';
import { R2Service } from '../../common/r2.service';

import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { Image } from '../products/entities/image.entity';
import { ProductVideo } from '../products/entities/product-video.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Notification } from './entities/notification.entity';
import { ProductAnalytics } from './entities/product-analytics.entity';
import { UserAnalytics } from './entities/user-analytics.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { StockDeductionFailure } from './entities/stock-deduction-failure.entity';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { ProductReview } from './entities/product-review.entity';

import { EmailProcessor } from './processors/email.processor';
import { UserEventsProcessor } from './processors/user-events.processor';
import { OrderPostProcessProcessor } from './processors/order.processor';
import { RefundProcessor } from './processors/refund.processor';
import { StockDeductProcessor } from './processors/stock-deduct.processor';
import { TokenCleanupProcessor } from './processors/token-cleanup.processor';
import { VideoProcessor } from './processors/video.processor';
import { MediaCleanupProcessor } from './processors/media-cleanup.processor';
import { OrphanCleanupProcessor } from './processors/orphan-cleanup.processor';

const QUEUES = [
  'user-events',
  'emails',
  'refunds',
  'order-post-process',
  'video-processing',
  'media-cleanup',
  'orphan-cleanup',
  'stock-deduct',
  'token-cleanup',
];

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: config.get<string>('REDIS_URL')
          ? { url: config.get<string>('REDIS_URL') }
          : {
              host: config.get<string>('REDIS_HOST', 'localhost'),
              port: config.get<number>('REDIS_PORT', 6379),
            },
      }),
    }),
    BullModule.registerQueue(...QUEUES.map((name) => ({ name }))),
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      User,
      Image,
      ProductVideo,
      Brand,
      Notification,
      ProductAnalytics,
      UserAnalytics,
      RefreshToken,
      StockDeductionFailure,
      AdminAuditLog,
      ProductReview,
    ]),
    MailModule,
    RedisModule,
  ],
  providers: [
    R2Service,
    EmailProcessor,
    UserEventsProcessor,
    OrderPostProcessProcessor,
    RefundProcessor,
    StockDeductProcessor,
    TokenCleanupProcessor,
    VideoProcessor,
    MediaCleanupProcessor,
    OrphanCleanupProcessor,
  ],
  exports: [BullModule],
})
export class WorkersModule {}