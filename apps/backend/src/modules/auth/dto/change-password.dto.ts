import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'old-password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'new-password' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
