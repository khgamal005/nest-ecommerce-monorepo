import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { AuthProvider } from './providers/auth.provider';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '../users/entities/user.entity';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authProvider: AuthProvider,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await this.authProvider.hashPassword(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
    });

    const token = this.issueToken(user);
    return { user: this.sanitize(user), token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await this.authProvider.comparePassword(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.issueToken(user);
    return { user: this.sanitize(user), token };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    // Always respond the same way whether or not the user exists,
    // so this endpoint can't be used to enumerate registered emails.
    if (!user) return { success: true };

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.usersService.setResetToken(user.id, token, expiry);

    // TODO: send this via the notifications module (email) instead of logging it.
    console.log(`Password reset link for ${email}: /reset-password?token=${token}`);

    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(dto.token);
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    const passwordHash = await this.authProvider.hashPassword(dto.newPassword);
    await this.usersService.updatePassword(user.id, passwordHash);
    await this.usersService.clearResetToken(user.id);

    return { success: true };
  }

  private issueToken(user: User): string {
    return this.authProvider.signToken({ sub: user.id, email: user.email, role: user.role });
  }

  private sanitize(user: User) {
    const { passwordHash, resetToken, resetTokenExpiry, ...safe } = user;
    return safe;
  }
}
