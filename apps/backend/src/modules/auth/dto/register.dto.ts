import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { AddressType } from '../../users/entities/address-type.enum';

export class RegisterAddressDto {
  @ApiProperty({ enum: AddressType, example: AddressType.HOME, required: false })
  @IsOptional()
  @IsEnum(AddressType)
  label?: AddressType;

  @ApiProperty({ example: 'Egypt' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'Cairo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ example: '12345' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ example: '+201234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ type: RegisterAddressDto, required: false })
  @IsOptional()
  @IsObject()
  address?: RegisterAddressDto;
}