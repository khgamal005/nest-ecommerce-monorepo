import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { AuthHelper } from './utils/auth.helper';
import { AuthProvider } from './providers/auth.provider';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyRegistrationDto } from './dto/verify-registration.dto';
import { AddressType } from '../users/entities/address-type.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authProvider: AuthProvider,
    private readonly authHelper: AuthHelper,
  ) {}



  async register(dto: RegisterDto) {
    const password = await this.authProvider.hashPassword(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      password,
      name: dto.name,
    });

    const token = this.issueAccessToken(user);
    return { user: this.sanitize(user), token };
  }

  

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      await this.authHelper.recordFailedLogin(dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await this.authProvider.comparePassword(dto.password, user.password ?? '');
    if (!isMatch) {
      await this.authHelper.recordFailedLogin(dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.authHelper.recordSuccessfulLogin(dto.email);

    const token = this.issueAccessToken(user);

    return {
      status: 'success',
      message: 'Logged in successfully',
      user: this.sanitize(user),
      token,
    };
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

  private issueAccessToken(user: User): string {
    return this.authProvider.signAccessToken({
      sub: user.id,
      email: user.email ?? '',
      role: user.role,
    });
  }

  private sanitize(user: User) {
    const { password, ...safe } = user;
    return safe;
  }
}

