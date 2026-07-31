import { IsString } from 'class-validator';

export class VerifyChangePasswordOtpDto {
  @IsString()
  otp: string;
}
