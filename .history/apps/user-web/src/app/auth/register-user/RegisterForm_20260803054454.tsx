'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import GoogleSignInButton from '../login/_components/GoogleSignInButton';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  registerSchema,
  type RegisterFormInputs,
} from '../../../../validation/registerSchema';
import axiosInstance from '../../../../utils/axiosInstance';

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
      const { data: json } = await axiosInstance.post('/api/register-user', data, { requiresAuth: false } as any);
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

      const { data: json } = await axiosInstance.post('/api/verify-user', {
        email: userData?.email,
        name: userData?.name,
        password: userData?.password,
        otp: otpCode,
        address: userData?.address,
      }, { requiresAuth: false } as any);
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
      await axiosInstance.post('/api/resend-otp', { email: userData?.email }, { requiresAuth: false } as any);
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
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 py-8">
      {!showOtp ? (
        <>
          {/* ✅ Registration Form Screen */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-md mx-auto p-6 shadow-lg border rounded-xl bg-white"
          >
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
              إنشاء حساب
            </h2>

            {/* NAME */}
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-700">
                الاسم الكامل
              </label>
              <input
                type="text"
                {...register('name')}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                placeholder="أدخل اسمك الكامل"
              />
              <p className="text-red-600 text-sm mt-1">
                {errors.name?.message}
              </p>
            </div>

            {/* EMAIL */}
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-700">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                {...register('email')}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                placeholder="أدخل بريدك الإلكتروني"
              />
              <p className="text-red-600 text-sm mt-1">
                {errors.email?.message}
              </p>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                كلمة المرور
              </label>

              <div className="relative">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  {...register('password')}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أنشئ كلمة مرور"
                />

                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <p className="text-red-600 text-sm mt-1">
                {errors.password?.message}
              </p>

              {/* PASSWORD STRENGTH INDICATOR */}
              {passwordValue && (
                <div className="mt-3 space-y-2">
                  {/* Strength bars - 3 segments for 3 strength levels */}
                  <div className="flex gap-1">
                    {[1, 2, 3].map((segment) => (
                      <div
                        key={segment}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          segment <= getStrengthData(passwordValue).score
                            ? getStrengthData(passwordValue).bgColor
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Strength text */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      القوة:{' '}
                      <span className={getStrengthData(passwordValue).color}>
                        {getStrengthData(passwordValue).label}
                      </span>
                    </span>

                    {/* Optional: Show requirements met */}
                    <span className="text-xs text-gray-500">
                      {
                        getStrengthData(passwordValue).segments.filter(
                          (s) => s.met
                        ).length
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ADDRESS SECTION */}
            <div className="mb-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                العنوان
              </h3>

              {/* COUNTRY */}
              <div className="mb-3">
                <label className="block mb-1 font-medium text-gray-700">
                  الدولة
                </label>
                <input
                  type="text"
                  {...register('address.country')}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  placeholder="أدخل الدولة"
                />
                <p className="text-red-600 text-sm mt-1">
                  {errors.address?.country?.message}
                </p>
              </div>

              {/* CITY */}
              <div className="mb-3">
                <label className="block mb-1 font-medium text-gray-700">
                  المدينة
                </label>
                <input
                  type="text"
                  {...register('address.city')}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  placeholder="أدخل المدينة"
                />
                <p className="text-red-600 text-sm mt-1">
                  {errors.address?.city?.message}
                </p>
              </div>

              {/* STREET */}
              <div className="mb-3">
                <label className="block mb-1 font-medium text-gray-700">
                  الشارع
                </label>
                <input
                  type="text"
                  {...register('address.street')}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  placeholder="أدخل الشارع"
                />
                <p className="text-red-600 text-sm mt-1">
                  {errors.address?.street?.message}
                </p>
              </div>

              {/* ZIP CODE */}
              <div className="mb-3">
                <label className="block mb-1 font-medium text-gray-700">
                  الرمز البريدي (اختياري)
                </label>
                <input
                  type="text"
                  {...register('address.zipCode')}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  placeholder="أدخل الرمز البريدي"
                />
                <p className="text-red-600 text-sm mt-1">
                  {errors.address?.zipCode?.message}
                </p>
              </div>

              {/* PHONE */}
              <div className="mb-3">
                <label className="block mb-1 font-medium text-gray-700">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  {...register('address.phone')}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  placeholder="أدخل رقم الهاتف"
                />
                <p className="text-red-600 text-sm mt-1">
                  {errors.address?.phone?.message}
                </p>
              </div>
            </div>

            {/* BACKEND ERROR */}
            {serverError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{serverError}</p>
              </div>
            )}

            {/* SUCCESS */}
            {successMessage && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 rounded-lg flex items-center justify-center"
            >
              {registerMutation.isPending && (
                <Loader2 className="animate-spin ml-2" />
              )}
              {registerMutation.isPending
                ? 'جاري إنشاء الحساب...'
                : 'إنشاء حساب'}
            </button>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-2 text-xs text-gray-500">
                أو المتابعة باستخدام
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Google Button */}
            <GoogleSignInButton callbackUrl="/" />

            {/* Login Link */}
            <p className="mt-4 text-center text-sm">
              لديك حساب بالفعل؟{' '}
              <Link
                href="/auth/login"
                className="text-blue-500 hover:underline"
              >
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </>
      ) : (
        <>
          {/* ✅ OTP Screen */}
          <div className="w-full max-w-md mx-auto p-6 shadow-lg border rounded-xl bg-white">
            <h3 className="text-xl font-semibold text-center mb-6">
              تأكيد بريدك الإلكتروني
            </h3>
            <p className="text-gray-600 text-center mb-6 text-sm">
              لقد أرسلنا رمز تفعيل إلى بريدك الإلكتروني. يرجى إدخاله أدناه.
            </p>

            <div className="flex justify-center gap-3 mb-6 dir-ltr">
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
                  className="w-12 h-12 text-center border rounded-lg text-lg"
                  style={{ direction: 'ltr' }}
                />
              ))}
            </div>

            {/* Error Msg */}
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
              onClick={() => verifyOtpMutation.mutate()}
              disabled={verifyOtpMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg flex justify-center"
            >
              {verifyOtpMutation.isPending && (
                <Loader2 className="animate-spin ml-2" />
              )}
              {verifyOtpMutation.isPending ? 'جاري التحقق...' : 'تفعيل الحساب'}
            </button>

            <div className="text-center mt-4">
              {canResend ? (
                <button
                  onClick={() => resendOtpMutation.mutate()}
                  className="text-blue-500 hover:underline text-sm"
                >
                  إعادة إرسال الرمز
                </button>
              ) : (
                <p className="text-sm text-gray-600">
                  إعادة إرسال الرمز خلال{' '}
                  <span className="text-blue-500 font-semibold">{timer}</span>{' '}
                  ثانية
                </p>
              )}
            </div>

            <div className="text-center mt-4">
              <button
                onClick={() => setShowOtp(false)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
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
