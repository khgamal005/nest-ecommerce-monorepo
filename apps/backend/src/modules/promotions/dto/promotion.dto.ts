import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { CouponDiscountType } from '../entities/coupon.entity';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  public_name: string;

  @IsIn(['percentage', 'fixed'])
  discount_type: CouponDiscountType;

  @IsNumber()
  @Min(0)
  discount_value: number;

  @IsString()
  @Matches(/^[A-Za-z0-9]+$/)
  @MinLength(3)
  discount_code: string;

  @IsOptional()
  @IsString()
  sellerId?: string | null;
}

export class UpdatePromotionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  public_name: string;

  @IsIn(['percentage', 'fixed'])
  discount_type: CouponDiscountType;

  @IsNumber()
  @Min(0)
  discount_value: number;

  @IsString()
  @Matches(/^[A-Za-z0-9]+$/)
  @MinLength(3)
  discount_code: string;
}

export class ActiveDiscountCodesDto {
  @IsArray()
  @IsString({ each: true })
  sellerIds: string[];
}