import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterAddressDto {
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