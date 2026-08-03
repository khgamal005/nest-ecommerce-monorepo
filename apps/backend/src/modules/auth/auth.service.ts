import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

    async verifyUserRegistration(dto: VerifyRegistrationDto) {
    const pending = await this.authHelper.getPendingRegistration(dto.otp);
    if (!pending) {
      throw new BadRequestException(
        'Invalid or expired registration OTP. Please register again.',
      );
    }

    const existingUser = await this.usersService.findByEmail(pending.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    await this.authHelper.verifyOtp(pending.email, dto.otp);

    const hashedPassword = await this.authProvider.hashPassword(pending.password);

    const user = await this.usersService.create({
      email: pending.email,
      password: hashedPassword,
      name: pending.name,
      addresses: pending.address
        ? [
            {
              label: AddressType.HOME,
              country: pending.address.country ?? '',
              city: pending.address.city,
              street: pending.address.street,
              zipCode: pending.address.zipCode || null,
              phone: pending.address.phone || null,
              isDefault: true,
            },
          ]
        : [],
    });

    await this.authHelper.deletePendingRegistration(dto.otp);

    const token = this.issueAccessToken(user);
    return {
      status: 'success',
      message: 'Account verified successfully',
      user: this.sanitize(user),
      token,
    };
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
    if (!dto.email || !dto.newPassword || !dto.resetToken) {
      throw new BadRequestException('Email, reset token, and new password are required');
    }

    const storedToken = await this.authHelper.getResetToken(dto.email);
    if (!storedToken || storedToken !== dto.resetToken) {
      throw new UnauthorizedException(
        'Invalid or expired reset token. Please request a new password reset.',
      );
    }

    await this.authHelper.deleteResetToken(dto.email);

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { status: 'success', message: 'If this email is registered, the password has been reset.' };
    }

    if (!user.password) {
      throw new BadRequestException('User has no password set');
    }

    const isSamePassword = await this.authProvider.comparePassword(dto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('Old password and new password must be different');
    }

    const hashedPassword = await this.authProvider.hashPassword(dto.newPassword);
    await this.usersService.updatePassword(user.id, hashedPassword);

    return { status: 'success', message: 'Password has been reset successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    return {
      message: 'User profile fetched successfully',
      success: true,
      user: this.sanitize(user),
    };
  }

  async sendChangePasswordOtp(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const email = user.email ?? '';
    await this.authHelper.checkOtpRegistration(email);
    await this.authHelper.trackOtpRequests(email);
    await this.authHelper.sendOtp(user.name ?? 'User', email, 'forget-password-user-mail');

    return { status: 'success', message: 'OTP sent to your email for password change verification' };
  }

  async verifyChangePasswordOtp(userId: string, otp: string) {
    if (!otp) {
      throw new BadRequestException('OTP is required');
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    await this.authHelper.verifyOtp(user.email ?? '', otp);

    return { status: 'success', message: 'OTP verified successfully. You can now change your password.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current password and new password are required');
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.password) {
      throw new BadRequestException('User has no password set');
    }

    const isCurrentPasswordValid = await this.authProvider.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await this.authProvider.comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const hashedPassword = await this.authProvider.hashPassword(newPassword);
    await this.usersService.updatePassword(userId, hashedPassword);

    return { status: 'success', message: 'Password changed successfully' };
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

