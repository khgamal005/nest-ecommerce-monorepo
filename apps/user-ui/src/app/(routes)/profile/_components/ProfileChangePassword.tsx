'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import axiosInstance from '@/utils/axiosInstance';
import toast from 'react-hot-toast';

type PasswordInputs = { currentPassword: string; newPassword: string };

const ProfileChangePassword = () => {
  const [step, setStep] = useState(1); // 1 = password form, 2 = OTP, 3 = success
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [passwordData, setPasswordData] = useState<PasswordInputs | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputsRefs = useRef<(HTMLInputElement | null)[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordInputs>();

  // ------------------- TIMER -------------------
  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setCanResend(false);
    setTimer(60);

    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ------------------- OTP HANDLERS -------------------
  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputsRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    const digits = pasted.replace(/\D/g, '');
    if (digits.length !== otp.length) return;
    setOtp(digits.split(''));
    inputsRefs.current[otp.length - 1]?.focus();
  };

  // ------------------- MUTATIONS -------------------
const sendOtpMutation = useMutation({
  mutationFn: async (data: PasswordInputs) => {
    const res = await axiosInstance.post(
      '/api/send-change-password-otp',
      {
        currentPassword: data.currentPassword,
      }
    );

    return { json: res.data, data };
  },
  onSuccess: ({ json, data }) => {
    toast.success(json.message);
    setPasswordData(data);
    startTimer();
    setStep(2); // move to OTP screen
  },
  onError: (err: any) =>
    toast.error(err.response?.data?.message || err.message),
});


const verifyOtpMutation = useMutation({
  mutationFn: async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      throw new Error('Please enter 4-digit OTP');
    }

    const res = await axiosInstance.post(
      '/api/verify-change-password-otp',
      { otp: otpCode }
    );

    return res.data;
  },
  onSuccess: () => {
    if (passwordData) {
      changePasswordMutation.mutate(passwordData);
    }
  },
  onError: (err: any) =>
    toast.error(err.response?.data?.message || err.message),
});


const resendOtpMutation = useMutation({
  mutationFn: async () => {
    const res = await axiosInstance.post(
      '/api/send-change-password-otp'
    );
    return res.data;
  },
  onSuccess: () => {
    setOtp(['', '', '', '']);
    inputsRefs.current[0]?.focus();
    startTimer();
    toast.success('OTP resent successfully');
  },
  onError: (err: any) =>
    toast.error(err.response?.data?.message || err.message),
});


const changePasswordMutation = useMutation({
  mutationFn: async (data: PasswordInputs) => {
    const res = await axiosInstance.post(
      '/api/change-password',
      data
    );
    return res.data;
  },
  onSuccess: (json) => {
    toast.success(json.message || 'Password changed successfully!');
    setStep(3); // Success screen
    reset();
  },
  onError: (err: any) =>
    toast.error(
      err.response?.data?.message || 'Server error. Please try again.'
    ),
});


  // ------------------- SUBMIT HANDLERS -------------------
  const onPasswordSubmit = (data: PasswordInputs) => {
    setServerError(null);
    setSuccessMessage(null);
    sendOtpMutation.mutate(data);
  };

  const handleReset = () => {
    setStep(1);
    setOtp(['', '', '', '']);
    setServerError(null);
    setSuccessMessage(null);
    setPasswordData(null);
    reset();
  };

  // ------------------- RENDER -------------------
  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 shadow-lg border rounded-xl bg-white">
      {step === 1 && (
        <>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5 text-center">
            Change Password
          </h2>
          <p className="text-gray-600 text-center mb-4 text-xs sm:text-sm">
            Enter your current and new password. We&apos;ll send an OTP to
            verify the change.
          </p>
          <form onSubmit={handleSubmit(onPasswordSubmit)}>
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                {...register('currentPassword', {
                  required: 'Current password is required',
                })}
                className="border rounded px-3 py-2 w-full text-sm sm:text-base"
              />
              {errors.currentPassword && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: {
                    value: 4,
                    message: 'Password must be at least 4 characters',
                  },
                  maxLength: {
                    value: 16,
                    message: 'Password must be at most 16 characters',
                  },
                })}
                className="border rounded px-3 py-2 w-full text-sm sm:text-base"
              />
              {errors.newPassword && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-red-500 text-xs sm:text-sm mb-2">{serverError}</p>
            )}
            {successMessage && (
              <p className="text-green-600 text-xs sm:text-sm mb-2">{successMessage}</p>
            )}

            <button
              type="submit"
              disabled={sendOtpMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 sm:py-2.5 rounded-lg flex items-center justify-center text-sm sm:text-base"
            >
              {sendOtpMutation.isPending && (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              )}
              {sendOtpMutation.isPending ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5 text-center">
            Verify OTP
          </h2>
          <p className="text-gray-600 text-center mb-4 text-xs sm:text-sm">
            Enter the 4-digit code sent to your email.
          </p>
          <div className="flex justify-center gap-2 sm:gap-3 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                ref={(el: HTMLInputElement | null) => {
                  inputsRefs.current[index] = el;
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 text-center border rounded-lg text-base sm:text-lg"
              />
            ))}
          </div>
          {serverError && (
            <p className="text-red-500 text-xs sm:text-sm mb-2 text-center">
              {serverError}
            </p>
          )}
          {successMessage && (
            <p className="text-green-600 text-xs sm:text-sm mb-2 text-center">
              {successMessage}
            </p>
          )}
          <button
            onClick={() => verifyOtpMutation.mutate()}
            disabled={
              verifyOtpMutation.isPending || changePasswordMutation.isPending
            }
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 sm:py-2.5 rounded-lg flex items-center justify-center text-sm sm:text-base mb-2"
          >
            {(verifyOtpMutation.isPending ||
              changePasswordMutation.isPending) && (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            )}
            {verifyOtpMutation.isPending || changePasswordMutation.isPending
              ? 'Processing...'
              : 'Verify & Change Password'}
          </button>
          <div className="text-center">
            {canResend ? (
              <button
                onClick={() => resendOtpMutation.mutate()}
                className="text-blue-500 hover:underline text-xs sm:text-sm"
              >
                Resend OTP
              </button>
            ) : (
              <p className="text-xs sm:text-sm text-gray-600">
                Resend OTP in{' '}
                <span className="text-blue-500 font-semibold">{timer}</span>s
              </p>
            )}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-green-600">
              Success!
            </h2>
            <p className="text-gray-600 mb-5 sm:mb-6 text-xs sm:text-sm">
              {successMessage || 'Your password has been changed successfully.'}
            </p>
            <button
              onClick={handleReset}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 sm:py-2.5 rounded-lg text-sm sm:text-base"
            >
              Change Password Again
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileChangePassword;
