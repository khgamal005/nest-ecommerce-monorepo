import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductImageDto {
  @IsString()
  file_Url: string;

  @IsOptional()
  @IsString()
  fileId?: string;
}

export class ProductVideoDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  fileId?: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsNumber()
  size_bytes?: number;
}

export class ProductOptionValueDto {
  @IsString()
  value: string;
}

export class ProductOptionDto {
  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionValueDto)
  values: ProductOptionValueDto[];
}

export class VariantOptionValueDto {
  @IsString()
  name: string;

  @IsString()
  value: string;
}

export class ProductVariantDto {
  @IsString()
  sku: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @IsNumber()
  stock: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  starting_date?: string;

  @IsOptional()
  @IsString()
  ending_date?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  optionValues?: { [key: string]: string };
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  short_description: string;

  @IsString()
  @IsNotEmpty()
  detailed_description: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsUUID()
  categoryId: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  warranty?: string;

  @IsOptional()
  @IsString()
  cashOnDelivery?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVideoDto)
  videos?: ProductVideoDto[];

  @IsBoolean()
  @IsOptional()
  hasVariants?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  options?: ProductOptionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  // Simple product fields
  @IsOptional()
  @IsNumber()
  regular_price?: number;

  @IsOptional()
  @IsNumber()
  sale_price?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsString()
  starting_date?: string;

  @IsOptional()
  @IsString()
  ending_date?: string;

  @IsOptional()
  @IsBoolean()
  isReturnable?: boolean;

  @IsOptional()
  custom_specifications?: any;
}

export class UpdateProductDto extends CreateProductDto {
  @IsOptional()
  @IsUUID()
  productId?: string;
}
