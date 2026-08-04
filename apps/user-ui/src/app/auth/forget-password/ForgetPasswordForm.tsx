'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axiosInstance';

type ForgetPasswordInputs = { email: string };
type ResetInputs = { email: string; resetToken: string; newPassword: string };

const ForgetPasswordForm = () => {
  const [step, setStep] = useState(1); // 1 = forget, 2 = otp, 3 = reset
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [userData, setUserData] = useState<ForgetPasswordInputs | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const inputsRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>();

  // ------------------- TIMER -------------------
  const startTimer = () => {
    // If an old interval exists, clear it first
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

  // 🧹 Cleanup on unmount to avoid memory leaks
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
    e: React.KeyboardEvent<HTMLInputElement>,
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ------------------- MUTATIONS -------------------
  const forgetPasswordMutation = useMutation({
    mutationFn: async (data: ForgetPasswordInputs) => {
      const { data: json } = await axiosInstance.post('/api/auth/forgot-password', data, { requiresAuth: false } as any);
      return { json, data };
    },
    onSuccess: ({ json, data }) => {
      toast.success(json.message);
      setUserData(data);
      startTimer();
      setStep(2);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const otpCode = otp.join('');
      if (otpCode.length !== 4) throw new Error('الرجاء إدخال رمز التحقق المكون من 4 أرقام');
      const { data: json } = await axiosInstance.post('/api/auth/verify-forget-password-otp', { email: userData?.email, otp: otpCode }, { requiresAuth: false } as any);
      return json;
    },
    onSuccess: (json) => {
      toast.success('تم التحقق بنجاح');
      setResetToken(json.resetToken);
      setStep(3);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post('/api/auth/forgot-password', { email: userData?.email }, { requiresAuth: false } as any);
    },
    onSuccess: () => {
      toast.success('تم إعادة إرسال رمز التحقق');
      setOtp(['', '', '', '']);
      inputsRefs.current[0]?.focus();
      startTimer();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetInputs) => {
      const { data: json } = await axiosInstance.post('/api/auth/reset-password', { ...data, resetToken: data.resetToken || resetToken }, { requiresAuth: false } as any);
      return { json, data };
    },
    onSuccess: ({ json }) => {
      toast.success(json.message || 'تم إعادة تعيين كلمة المرور بنجاح!');
      timeoutRef.current = setTimeout(() => router.push('/auth/login'), 2000);
    },
    onError: (err: any) => toast.error(err.message || 'خطأ في الخادم. الرجاء المحاولة مرة أخرى.'),
  });

  // ------------------- SUBMIT HANDLERS -------------------
  const onForgetSubmit = (data: ForgetPasswordInputs) => {
    setServerError(null);
    setSuccessMessage(null);
    forgetPasswordMutation.mutate(data);
  };

  const onResetSubmit = (data: ResetInputs) => {
    setServerError(null);
    setSuccessMessage(null);
    resetPasswordMutation.mutate(data);
  };

  const handleOtpSubmit = () => {
    setServerError(null);
    verifyOtpMutation.mutate();
  };

  // ------------------- RENDER -------------------
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 py-8" dir="rtl">
      <div className="w-full max-w-lg mx-auto p-8 shadow-lg border rounded-xl bg-white">
        {step === 1 && (
          <>
            <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">
              نسيت كلمة المرور
            </h2>
            <p className="text-gray-600 text-center mb-6 text-sm">
              أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق.
            </p>
            <form onSubmit={handleSubmit(onForgetSubmit)}>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  {...register('email', { required: 'البريد الإلكتروني مطلوب' })}
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.email?.message && (
                  <p className="text-red-600 text-sm mt-2">
                    {String(errors.email.message)}
                  </p>
                )}
              </div>
              {serverError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{serverError}</p>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{successMessage}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={forgetPasswordMutation.isPending}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg flex items-center justify-center font-medium text-lg transition-colors"
              >
                {forgetPasswordMutation.isPending && (
                  <Loader2 className="animate-spin ml-2" />
                )}
                {forgetPasswordMutation.isPending
                  ? 'جاري الإرسال...'
                  : 'إرسال رمز التحقق'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">
              التحقق من الرمز
            </h2>
            <p className="text-gray-600 text-center mb-8 text-sm">
              أدخل رمز التحقق المكون من 4 أرقام الذي تم إرساله إلى بريدك الإلكتروني.
            </p>
            <div className="flex justify-center gap-4 dir-ltr">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  ref={(el: HTMLInputElement | null) => {
                    inputsRefs.current[index] = el;
                  }}
                  className="w-14 h-14 text-center border-2 rounded-xl text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  style={{ 
                    direction: 'ltr',
                    borderColor: digit ? '#3b82f6' : '#d1d5db',
                    backgroundColor: '#f9fafb'
                  }}
                />
              ))}
            </div>
            {serverError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">
                  {serverError}
                </p>
              </div>
            )}
            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm text-center">{message}</p>
              </div>
            )}
            <button
              onClick={handleOtpSubmit}
              disabled={verifyOtpMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg flex items-center justify-center font-medium text-lg mb-4 transition-colors"
            >
              {verifyOtpMutation.isPending && (
                <Loader2 className="animate-spin ml-2" />
              )}
              {verifyOtpMutation.isPending ? 'جاري التحقق...' : 'تحقق من الرمز'}
            </button>
            <div className="text-center">
              {canResend ? (
                <button
                  onClick={() => resendOtpMutation.mutate()}
                  className="text-blue-500 hover:underline text-sm font-medium"
                >
                  إعادة إرسال الرمز
                </button>
              ) : (
                <p className="text-sm text-gray-600">
                  إعادة إرسال الرمز خلال{' '}
                  <span className="text-blue-500 font-semibold">{timer}</span> ثانية
                </p>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">
              إعادة تعيين كلمة المرور
            </h2>
            <p className="text-gray-600 text-center mb-6 text-sm">
              أنشئ كلمة مرور جديدة لحسابك.
            </p>
            <form onSubmit={handleSubmit(onResetSubmit)}>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  {...register('email', { required: 'البريد الإلكتروني مطلوب' })}
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.email?.message && (
                  <p className="text-red-600 text-sm mt-2">
                    {String(errors.email.message)}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="كلمة المرور الجديدة"
                    {...register('newPassword', {
                      required: 'كلمة المرور الجديدة مطلوبة',
                    })}
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  >
                    {passwordVisible ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
                {errors.newPassword?.message && (
                  <p className="text-red-600 text-sm mt-2">
                    {String(errors.newPassword.message)}
                  </p>
                )}
              </div>

              {serverError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{serverError}</p>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg flex items-center justify-center font-medium text-lg transition-colors"
              >
                {resetPasswordMutation.isPending && (
                  <Loader2 className="animate-spin ml-2" />
                )}
                {resetPasswordMutation.isPending
                  ? 'جاري إعادة التعيين...'
                  : 'إعادة تعيين كلمة المرور'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgetPasswordForm;
