import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'reset-token-from-verify-step' })
  @IsString()
  resetToken: string;

  @ApiProperty({ example: 'new-password' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
