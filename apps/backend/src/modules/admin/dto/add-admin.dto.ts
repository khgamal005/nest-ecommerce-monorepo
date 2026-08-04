import { IsEmail, IsIn, IsString } from 'class-validator';

export class AddAdminDto {
  @IsEmail()
  @IsString()
  email: string;

  @IsIn(['admin', 'user'])
  role: 'admin' | 'user';
}
