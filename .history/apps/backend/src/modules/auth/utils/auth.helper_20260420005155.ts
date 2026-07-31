import { ValidationError } from '@packages/error-handler';
import crypto from 'node:crypto';
import { redis } from '../../../../packages/libs/prisma/redis/index.js';
import { sendEmail } from './sendEmail/index.js';
import { prisma } from '../../../../packages/libs/prisma/index.js';
import { NextFunction, Request, Response } from 'express';

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_TTL = 300; // 5 min  — OTP validity window
const OTP_COOLDOWN_TTL = 60; // 1 min  — min gap between OTP requests
const OTP_LOCK_TTL = 1800; // 30 min — account lock after failed attempts
const OTP_SPAM_LOCK_TTL = 3600; // 1 hr   — spam lock after too many requests
const OTP_REQUEST_WINDOW = 3600; // 1 hr  — rolling window for request counting
const OTP_MAX_REQUESTS = 6; // max OTP requests per window
const OTP_MAX_FAILED = 3; // max wrong OTP attempts before lock
const RESET_TOKEN_TTL = 600; // 10 min — password reset token validity
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

// ─── Redis Key Helpers ────────────────────────────────────────────────────────

const keys = {
  otp: (email: string) => `otp:${email}`,
  otpLock: (email: string) => `otp_lock:${email}`,
  otpSpamLock: (email: string) => `otp_spam_lock:${email}`,
  otpCooldown: (email: string) => `otp_cooldown:${email}`,
  otpRequestCount: (email: string) => `otp_request_count:${email}`,
  otpFailedAttempts: (email: string) => `otp_failed_attempts:${email}`,
  resetToken: (email: string) => `reset_token:${email}`,
};

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^\S+$/;

export const validationRegistrationData = (
  data: any,
  userType: 'user' | 'seller'
): true => {
  const { email, password, name } = data;

  if (!email || !password || !name) {
    throw new ValidationError('Missing required fields for registration');
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw new ValidationError(
      `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`
    );
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new ValidationError('Password must contain only letters or numbers');
  }

  return true;
};

// ─── OTP Rate-Limit Checks ────────────────────────────────────────────────────

/**
 * Throws if the email is locked (too many failures) or spam-locked (too many
 * requests). Returns early (via next) if the per-minute cooldown is active.
 */
export const checkOtpRegistration = async (
  email: string,
  next: NextFunction
): Promise<void> => {
  if (await redis.get(keys.otpLock(email))) {
    throw new ValidationError(
      'Account locked due to too many failed attempts. Try again after 30 minutes.'
    );
  }

  if (await redis.get(keys.otpSpamLock(email))) {
    throw new ValidationError('Too many requests. Try again after 1 hour.');
  }

  if (await redis.get(keys.otpCooldown(email))) {
    return next(
      new ValidationError('Please wait 1 minute before requesting a new OTP.')
    );
  }
};

// ─── OTP Request Throttle ─────────────────────────────────────────────────────

/**
 * Increments the rolling request counter and spam-locks when the threshold
 * is reached. Must be called before sendOtp.
 */
export const trackotpRequests = async (email: string): Promise<void> => {
  const countKey = keys.otpRequestCount(email);
  const count = parseInt((await redis.get(countKey)) ?? '0', 10);

  if (count >= OTP_MAX_REQUESTS) {
    await redis.set(keys.otpSpamLock(email), 'locked', 'EX', OTP_SPAM_LOCK_TTL);
    throw new ValidationError('Too many requests. Try again after 1 hour.');
  }

  // Preserve remaining TTL on the counter key if it already exists
  await redis.set(countKey, count + 1, 'KEEPTTL');
  // Only set TTL on first request
  if (count === 0) {
    await redis.expire(countKey, OTP_REQUEST_WINDOW);
  }
};

// ─── OTP Send ─────────────────────────────────────────────────────────────────

export const sendOtp = async (
  name: string,
  email: string,
  template: string
): Promise<void> => {
  const otp = crypto.randomInt(1000, 9999).toString();

  try {
    await sendEmail(email, 'Verify your email', template, { name, otp });
  } catch (err) {
    console.error('Failed to send OTP email:', err);
  }

  await Promise.all([
    redis.set(keys.otp(email), otp, 'EX', OTP_TTL),
    redis.set(keys.otpCooldown(email), 'true', 'EX', OTP_COOLDOWN_TTL),
  ]);
};

// ─── OTP Verify ───────────────────────────────────────────────────────────────

/**
 * Validates the submitted OTP. On success, deletes the OTP key and clears
 * failed-attempt counter. Returns a short-lived reset token so the caller
 * can gate the password-reset endpoint.
 */
export const verifyOtp = async (
  email: string,
  otp: string
): Promise<string> => {
  const savedOtp = await redis.get(keys.otp(email));

  if (!savedOtp) {
    throw new ValidationError(
      'OTP expired or not found. Please request a new one.'
    );
  }

  const failedKey = keys.otpFailedAttempts(email);
  const failedAttempts = parseInt((await redis.get(failedKey)) ?? '0', 10);

  if (savedOtp !== otp) {
    if (failedAttempts >= OTP_MAX_FAILED - 1) {
      // Lock the account and clean up
      await Promise.all([
        redis.set(keys.otpLock(email), 'locked', 'EX', OTP_LOCK_TTL),
        redis.del(keys.otp(email)),
        redis.del(failedKey),
      ]);
      throw new ValidationError(
        'Account locked due to too many failed attempts. Try again after 30 minutes.'
      );
    }

    await redis.set(failedKey, failedAttempts + 1, 'EX', OTP_TTL);

    const remaining = OTP_MAX_FAILED - (failedAttempts + 1);
    throw new ValidationError(
      `Invalid OTP. ${remaining} attempt${
        remaining === 1 ? '' : 's'
      } remaining.`
    );
  }

  // Success — delete OTP and failed counter, issue a reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  await Promise.all([
    redis.del(keys.otp(email)),
    redis.del(failedKey),
    redis.set(keys.resetToken(email), resetToken, 'EX', RESET_TOKEN_TTL),
  ]);

  return resetToken;
};

// ─── Forget Password ──────────────────────────────────────────────────────────

export const handleForgetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: 'user' | 'seller'
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const user =
      userType === 'user'
        ? await prisma.users.findUnique({ where: { email } })
        : await prisma.sellers.findUnique({ where: { email } });

    if (!user) {
      // Avoid leaking whether the email exists — same response either way
      throw new ValidationError(
        'If this email is registered, an OTP will be sent.'
      );
    }

    await checkOtpRegistration(email, next);
    await trackotpRequests(email);
    await sendOtp(
      user.name ?? 'User',
      email,
      userType === 'user'
        ? 'forget-password-user-mail'
        : 'forget-password-seller-mail'
    );

    res.status(200).json({ message: 'OTP sent. Please check your email.' });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Forget-Password OTP ───────────────────────────────────────────────

export const verifyForgetPasswordOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ValidationError('Email and OTP are required');
    }

    const resetToken = await verifyOtp(email, otp);

    res.status(200).json({
      message: 'OTP verified. You may now reset your password.',
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};
