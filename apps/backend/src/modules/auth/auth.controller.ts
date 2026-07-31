import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthHelper } from './utils/auth.helper';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyRegistrationDto } from './dto/verify-registration.dto';
import { VerifyChangePasswordOtpDto } from './dto/verify-change-password-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 60 * 60 * 1000; // 1h

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authHelper: AuthHelper,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authHelper.initiateRegistration(dto, 'user');
  }

  @Post('verify-registration-otp')
  async verifyRegistrationOtp(
    @Body() dto: VerifyRegistrationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyUserRegistration(dto);
    setAuthCookie(res, result.token);
    return {
      status: result.status,
      message: result.message,
      user: result.user,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    setAuthCookie(res, result.token);
    return {
      status: result.status,
      message: result.message,
      user: result.user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authHelper.handleForgetPassword(dto.email, 'user');
    return { message: 'OTP sent. Please check your email.' };
  }

  @Post('verify-forget-password-otp')
  async verifyForgetPasswordOtp(@Body() dto: VerifyOtpDto) {
    const resetToken = await this.authHelper.verifyForgetPasswordOtp(dto.email, dto.otp);
    return {
      message: 'OTP verified. You may now reset your password.',
      resetToken,
    };
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-change-password-otp')
  sendChangePasswordOtp(@CurrentUser() user: any) {
    return this.authService.sendChangePasswordOtp(user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-change-password-otp')
  verifyChangePasswordOtp(
    @CurrentUser() user: any,
    @Body() dto: VerifyChangePasswordOtpDto,
  ) {
    return this.authService.verifyChangePasswordOtp(user?.id, dto.otp);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user?.id, dto.currentPassword, dto.newPassword);
  }
}
