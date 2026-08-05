import { IsString } from 'class-validator';

export class PromoteBrandDto {
  @IsString()
  brandName: string;
}
