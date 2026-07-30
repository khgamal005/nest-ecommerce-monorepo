import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

// This module wires every domain feature into ONE deployable NestJS
// application -- this is what makes the backend a monolith rather than
// a set of microservices. Each imported module is self-contained
// (its own controller/service/dto/entities) so it CAN be extracted into
// its own service later if needed.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    InventoryModule,
    ReviewsModule,
    PromotionsModule,
    ShippingModule,
    NotificationsModule,
    UploadModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
