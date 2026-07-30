import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { AuthProvider } from './providers/auth.provider';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authProvider: AuthProvider,
  ) {}

  async register(dto: RegisterDto) {
    const password = await this.authProvider.hashPassword(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      password,
      name: dto.name,
    });

    const token = this.issueToken(user);
    return { user: this.sanitize(user), token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await this.authProvider.comparePassword(dto.password, user.password ?? '');
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.issueToken(user);
    return { user: this.sanitize(user), token };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { success: true };

    const token = crypto.randomBytes(32).toString('hex');
    // TODO: store token + expiry in a separate reset_tokens table,
    // then send email via the notifications module.
    console.log(`Password reset link for ${email}: /reset-password?token=${token}`);

    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // TODO: look up token from a separate reset_tokens table
    console.log(`Reset password request for token: ${dto.token}`);
    return { success: true };
  }

  private issueToken(user: User): string {
    return this.authProvider.signToken({ sub: user.id, email: user.email ?? '', role: user.role });
  }

  private sanitize(user: User) {
    const { password, ...safe } = user;
    return safe;
  }
}
