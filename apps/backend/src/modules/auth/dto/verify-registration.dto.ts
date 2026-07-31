import { IsEmail, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class VerifyRegistrationDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  otp: string;

  @IsOptional()
  @IsObject()
  address?: {
    country?: string;
    city?: string;
    street?: string;
    zipCode?: string;
    phone?: string;
  };
}
