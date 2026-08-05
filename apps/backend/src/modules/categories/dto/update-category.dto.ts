import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsIn([1, 2, 3])
  level?: number;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;
}