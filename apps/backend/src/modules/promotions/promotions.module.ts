import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { Coupon } from './entities/coupon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon])],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService, TypeOrmModule],
})
export class PromotionsModule {}