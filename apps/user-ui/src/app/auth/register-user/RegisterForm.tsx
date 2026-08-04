'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, MailCheck, MapPin, UserPlus } from 'lucide-react';
import GoogleSignInButton from '../login/_components/GoogleSignInButton';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  registerSchema,
  type RegisterFormInputs,
} from '../../../validation/registerSchema';
import axiosInstance from '../../../utils/axiosInstance';

const RegisterForm = () => {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema as any),
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);

  const [otp, setOtp] = useState(['', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [userData, setUserData] = useState<RegisterFormInputs | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const passwordValue = watch('password');

  const inputsRefs = useRef<(HTMLInputElement | null)[]>([]);
  const getStrengthData = (password: string) => {
    if (!password)
      return {
        score: 0,
        color: 'text-gray-400',
        label: '',
        bgColor: 'bg-gray-400',
        segments: [],
      };

    let score = 0;
    const requirements = [
      password.length >= 6,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    const metCount = requirements.filter(Boolean).length;

    // Map 4 requirements to 3 strength levels
    if (metCount <= 1) {
      score = 1; // Weak
    } else if (metCount <= 2) {
      score = 2; // Medium
    } else {
      score = 3; // Strong
    }

    const strengthData = [
      { color: 'text-red-500', label: 'ضعيف', bgColor: 'bg-red-500' },
      { color: 'text-yellow-500', label: 'متوسط', bgColor: 'bg-yellow-500' },
      { color: 'text-green-500', label: 'قوي', bgColor: 'bg-green-500' },
    ];

    const currentStrength = strengthData[score - 1] || strengthData[0];

    return {
      score,
      ...currentStrength,
      segments: requirements.map((met, index) => ({
        met: index < metCount,
        requirement: ['6+ أحرف', 'حرف كبير', 'رقم', 'رمز خاص'][index],
      })),
    };
  };
  // ✅ OTP Auto Focus
  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputsRefs.current[index + 1]?.focus();
    }
  };
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault(); // stop default paste behavior

    const pasted = e.clipboardData.getData('text').trim();
    const digits = pasted.replace(/\D/g, ''); // remove anything not 0–9

    if (digits.length !== otp.length) return;

    const newOtp = digits.split(''); // ['4','9','3','1']
    setOtp(newOtp);

    // focus last input
    inputsRefs.current[otp.length - 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRefs.current[index - 1]?.focus();
    }
  };

  // ✅ Timer logic
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

  // ✅ React Query — Register Mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormInputs) => {
      const { data: json } = await axiosInstance.post('/api/auth/register', data, { requiresAuth: false } as any);
      return { json, data };
    },

    onSuccess: ({ json, data }) => {
      toast.success(json.message);
      setShowOtp(true);
      setUserData(data);
      startTimer();
    },

    onError: (err: any) => toast.error(err.message),
  });

  const onSubmit = (data: RegisterFormInputs) => {
    setServerError(null);
    setSuccessMessage(null);
    registerMutation.mutate(data);
  };

  // ✅ React Query — Verify OTP Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const otpCode = otp.join('');
      if (otpCode.length !== 4)
        throw new Error('يرجى إدخال رمز التحقق المكون من 4 أرقام');

      const { data: json } = await axiosInstance.post(
        '/api/auth/verify-registration-otp',
        { otp: otpCode },
        { requiresAuth: false } as any,
      );
      return json;
    },

    onSuccess: () => {
      setMessage('✅ تم تفعيل الحساب بنجاح');

      timeoutRef.current = setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    },

    onError: (err: any) => setServerError(err.message),
  });

  // ✅ Resend OTP mutation
  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userData) throw new Error('بيانات التسجيل غير متوفرة');
      await axiosInstance.post('/api/auth/register', userData, { requiresAuth: false } as any);
    },

    onSuccess: () => {
      startTimer();
      setOtp(['', '', '', '']);
      inputsRefs.current[0]?.focus();
    },

    onError: () => setServerError('فشل في إعادة إرسال رمز التحقق'),
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 py-6 sm:py-10"
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute left-1/3 top-1/3 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />

      {!showOtp ? (
        <>
          {/* Registration Form Screen */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="relative mx-auto w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:max-w-lg sm:p-8"
          >
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/30">
                <UserPlus size={26} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                إنشاء حساب
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                انضم إلينا وابدأ التسوق الآن
              </p>
            </div>

            {/* NAME */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                الاسم الكامل
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل اسمك الكامل"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل بريدك الإلكتروني"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أنشئ كلمة مرور"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}

              {/* PASSWORD STRENGTH INDICATOR */}
              {passwordValue && (
                <div className="mt-3 space-y-2">
                  {/* Strength bars - 3 segments for 3 strength levels */}
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((segment) => (
                      <div
                        key={segment}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          segment <= getStrengthData(passwordValue).score
                            ? getStrengthData(passwordValue).bgColor
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Strength text */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      القوة:{' '}
                      <span className={getStrengthData(passwordValue).color}>
                        {getStrengthData(passwordValue).label}
                      </span>
                    </span>
                    <span className="text-xs text-slate-400">
                      {
                        getStrengthData(passwordValue).segments.filter(
                          (s) => s.met
                        ).length
                      }{' '}
                      / 4
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={confirmPasswordVisible ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أعد إدخال كلمة المرور"
                />
                <button
                  type="button"
                  onClick={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  {confirmPasswordVisible ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* ADDRESS SECTION */}
            <div className="mb-5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-blue-500" />
                <h3 className="text-base font-semibold text-slate-800">
                  العنوان
                </h3>
              </div>

              {/* LABEL */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  نوع العنوان
                </label>
                <select
                  {...register('address.label')}
                  className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Home">المنزل</option>
                  <option value="Work">العمل</option>
                  <option value="Other">أخرى</option>
                </select>
                {errors.address?.label && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.address.label.message}
                  </p>
                )}
              </div>

              {/* COUNTRY + CITY */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    الدولة
                  </label>
                  <input
                    type="text"
                    {...register('address.country')}
                    className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل الدولة"
                  />
                  {errors.address?.country && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.address.country.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    المدينة
                  </label>
                  <input
                    type="text"
                    {...register('address.city')}
                    className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل المدينة"
                  />
                  {errors.address?.city && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.address.city.message}
                    </p>
                  )}
                </div>
              </div>

              {/* STREET */}
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  الشارع
                </label>
                <input
                  type="text"
                  {...register('address.street')}
                  className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل الشارع"
                />
                {errors.address?.street && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.address.street.message}
                  </p>
                )}
              </div>

              {/* PHONE */}
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  {...register('address.phone')}
                  className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل رقم الهاتف"
                />
                {errors.address?.phone && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.address.phone.message}
                  </p>
                )}
              </div>

              {/* IS DEFAULT */}
              <label className="mt-4 flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  {...register('address.isDefault')}
                  className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                />
                <span className="text-sm text-slate-700">
                  العنوان الافتراضي
                </span>
              </label>
            </div>

            {/* BACKEND ERROR */}
            {serverError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{serverError}</p>
              </div>
            )}

            {/* SUCCESS */}
            {successMessage && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registerMutation.isPending && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              {registerMutation.isPending
                ? 'جاري إنشاء الحساب...'
                : 'إنشاء حساب'}
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
              <span className="text-xs text-slate-400">
                أو المتابعة باستخدام
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
            </div>

            {/* Google Button */}
            <GoogleSignInButton callbackUrl="/" />

            {/* Login Link */}
            <p className="mt-5 text-center text-sm text-slate-500">
              لديك حساب بالفعل؟{' '}
              <Link
                href="/auth/login"
                className="font-semibold text-blue-500 transition hover:text-blue-600"
              >
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </>
      ) : (
        <>
          {/* OTP Screen */}
          <div className="relative mx-auto w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/30">
              <MailCheck size={26} />
            </div>
            <h3 className="text-center text-xl font-bold text-slate-900 sm:text-2xl">
              تأكيد بريدك الإلكتروني
            </h3>
            <p className="mb-8 mt-2 text-center text-sm text-slate-500">
              لقد أرسلنا رمز تفعيل إلى بريدك الإلكتروني. يرجى إدخاله أدناه.
            </p>

            <div className="mb-8 flex justify-center gap-3 dir-ltr sm:gap-4">
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
                  className="h-12 w-12 rounded-xl border-0 bg-slate-50 text-center text-lg font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-14 sm:w-14"
                  style={{ direction: 'ltr' }}
                />
              ))}
            </div>

            {/* Error Msg */}
            {serverError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-center text-sm text-red-600">
                  {serverError}
                </p>
              </div>
            )}

            {message && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                <p className="text-center text-sm text-green-600">{message}</p>
              </div>
            )}

            <button
              onClick={() => verifyOtpMutation.mutate()}
              disabled={verifyOtpMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifyOtpMutation.isPending && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              {verifyOtpMutation.isPending ? 'جاري التحقق...' : 'تفعيل الحساب'}
            </button>

            <div className="mt-5 text-center">
              {canResend ? (
                <button
                  onClick={() => resendOtpMutation.mutate()}
                  className="text-sm font-medium text-blue-500 transition hover:text-blue-600"
                >
                  إعادة إرسال الرمز
                </button>
              ) : (
                <p className="text-sm text-slate-500">
                  إعادة إرسال الرمز خلال{' '}
                  <span className="font-semibold text-blue-500">{timer}</span>{' '}
                  ثانية
                </p>
              )}
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowOtp(false)}
                className="text-sm font-medium text-slate-400 transition hover:text-slate-600"
              >
                العودة للتسجيل
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegisterForm;
