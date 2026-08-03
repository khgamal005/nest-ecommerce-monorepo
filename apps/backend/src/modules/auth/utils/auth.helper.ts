import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../../users/users.service';
import { MailService } from '../../mail/mail.service';
import { RegisterDto } from '../dto/register.dto';

const OTP_TTL = 300;
const OTP_COOLDOWN_TTL = 60;
const OTP_LOCK_TTL = 1800;
const OTP_SPAM_LOCK_TTL = 3600;
const OTP_REQUEST_WINDOW = 3600;
const OTP_MAX_REQUESTS = 6;
const OTP_MAX_FAILED = 3;
const RESET_TOKEN_TTL = 600;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const LOGIN_MAX_FAILED = 5;
const LOGIN_FAILED_WINDOW = 900;
const LOGIN_LOCK_TTL = 900;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^\S+$/;

const keys = {
  otp: (email: string) => `otp:${email}`,
  otpLock: (email: string) => `otp_lock:${email}`,
  otpSpamLock: (email: string) => `otp_spam_lock:${email}`,
  otpCooldown: (email: string) => `otp_cooldown:${email}`,
  otpRequestCount: (email: string) => `otp_request_count:${email}`,
  otpFailedAttempts: (email: string) => `otp_failed_attempts:${email}`,
  resetToken: (email: string) => `reset_token:${email}`,
  loginFailed: (email: string) => `login_failed:${email}`,
  loginLock: (email: string) => `login_lock:${email}`,
  pendingRegistration: (otp: string) => `pending_registration:${otp}`,
};

@Injectable()
export class AuthHelper {
  constructor(
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  validateRegistrationData(data: any, _userType: 'user' | 'seller'): true {
    const { email, password, name } = data;

    if (!email || !password || !name) {
      throw new BadRequestException('Missing required fields for registration');
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      throw new BadRequestException(
        `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`,
      );
    }

    if (!PASSWORD_REGEX.test(password)) {
      throw new BadRequestException('Password must contain only letters or numbers');
    }

    return true;
  }

  async checkOtpRegistration(email: string): Promise<void> {
    if (await this.redisService.get(keys.otpLock(email))) {
      throw new BadRequestException(
        'Account locked due to too many failed attempts. Try again after 30 minutes.',
      );
    }

    if (await this.redisService.get(keys.otpSpamLock(email))) {
      throw new BadRequestException('Too many requests. Try again after 1 hour.');
    }

    if (await this.redisService.get(keys.otpCooldown(email))) {
      throw new BadRequestException('Please wait 1 minute before requesting a new OTP.');
    }
  }

  async trackOtpRequests(email: string): Promise<void> {
    const countKey = keys.otpRequestCount(email);
    const count = parseInt((await this.redisService.get(countKey)) ?? '0', 10);

    if (count >= OTP_MAX_REQUESTS) {
      await this.redisService.set(keys.otpSpamLock(email), 'locked', 'EX', OTP_SPAM_LOCK_TTL);
      throw new BadRequestException('Too many requests. Try again after 1 hour.');
    }

    await this.redisService.set(countKey, count + 1, 'EX', OTP_REQUEST_WINDOW);
  }

  async sendOtp(name: string, email: string, template: string): Promise<string> {
    const otp = crypto.randomInt(1000, 9999).toString();

    try {
      await this.mailService.sendMail(email, 'Verify your email', template, { name, otp });
    } catch (err) {
      console.error('Failed to send OTP email:', err);
    }

    await Promise.all([
      this.redisService.set(keys.otp(email), otp, 'EX', OTP_TTL),
      this.redisService.set(keys.otpCooldown(email), 'true', 'EX', OTP_COOLDOWN_TTL),
    ]);

    return otp;
  }

  async verifyOtp(email: string, otp: string): Promise<string> {
    const savedOtp = await this.redisService.get(keys.otp(email));

    if (!savedOtp) {
      throw new BadRequestException('OTP expired or not found. Please request a new one.');
    }

    const failedKey = keys.otpFailedAttempts(email);
    const failedAttempts = parseInt((await this.redisService.get(failedKey)) ?? '0', 10);

    if (savedOtp !== otp) {
      if (failedAttempts >= OTP_MAX_FAILED - 1) {
        await Promise.all([
          this.redisService.set(keys.otpLock(email), 'locked', 'EX', OTP_LOCK_TTL),
          this.redisService.del(keys.otp(email)),
          this.redisService.del(failedKey),
        ]);
        throw new BadRequestException(
          'Account locked due to too many failed attempts. Try again after 30 minutes.',
        );
      }

      await this.redisService.set(failedKey, failedAttempts + 1, 'EX', OTP_TTL);

      const remaining = OTP_MAX_FAILED - (failedAttempts + 1);
      throw new BadRequestException(
        `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    await Promise.all([
      this.redisService.del(keys.otp(email)),
      this.redisService.del(failedKey),
      this.redisService.set(keys.resetToken(email), resetToken, 'EX', RESET_TOKEN_TTL),
    ]);

    return resetToken;
  }

  async handleForgetPassword(email: string, userType: 'user' | 'seller'): Promise<void> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user =
      userType === 'user'
        ? await this.usersService.findByEmail(email)
        : null;

    if (!user) {
      throw new BadRequestException('If this email is registered, an OTP will be sent.');
    }

    await this.checkOtpRegistration(email);
    await this.trackOtpRequests(email);
    await this.sendOtp(
      user.name ?? 'User',
      email,
      userType === 'user'
        ? 'forget-password-user-mail'
        : 'forget-password-seller-mail',
    );
  }

  async verifyForgetPasswordOtp(email: string, otp: string): Promise<string> {
    if (!email || !otp) {
      throw new BadRequestException('Email and OTP are required');
    }

    return this.verifyOtp(email, otp);
  }

  async getResetToken(email: string): Promise<string | null> {
    return this.redisService.get(keys.resetToken(email));
  }

  async deleteResetToken(email: string): Promise<void> {
    await this.redisService.del(keys.resetToken(email));
  }

  async initiateRegistration(dto: RegisterDto, userType: 'user' | 'seller'): Promise<{ message: string }> {
    this.validateRegistrationData(dto, userType);

    const { name, email } = dto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      return { message: 'If this email is not already registered, an OTP has been sent.' };
    }

    await this.checkOtpRegistration(email);
    await this.trackOtpRequests(email);
    const otp = await this.sendOtp(name, email, 'user-activation-mail');

    const pending = JSON.stringify({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      address: dto.address ?? null,
    });
    await this.redisService.set(keys.pendingRegistration(otp), pending, 'EX', OTP_TTL);

    return { message: 'OTP sent to your email, please check your inbox.' };
  }

  async getPendingRegistration(otp: string): Promise<{
    email: string;
    password: string;
    name: string;
    address: RegisterDto['address'] | null;
  } | null> {
    const raw = await this.redisService.get(keys.pendingRegistration(otp));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async deletePendingRegistration(otp: string): Promise<void> {
    await this.redisService.del(keys.pendingRegistration(otp));
  }

  async recordFailedLogin(email: string): Promise<void> {
    const failedKey = keys.loginFailed(email);
    const count = parseInt((await this.redisService.get(failedKey)) ?? '0', 10) + 1;

    if (count >= LOGIN_MAX_FAILED) {
      await Promise.all([
        this.redisService.set(keys.loginLock(email), 'locked', 'EX', LOGIN_LOCK_TTL),
        this.redisService.del(failedKey),
      ]);
      throw new UnauthorizedException(
        'Account locked due to too many failed login attempts. Try again after 15 minutes.',
      );
    }

    await this.redisService.set(failedKey, count, 'EX', LOGIN_FAILED_WINDOW);
  }

  async recordSuccessfulLogin(email: string): Promise<void> {
    await Promise.all([
      this.redisService.del(keys.loginFailed(email)),
      this.redisService.del(keys.loginLock(email)),
    ]);
  }
}
