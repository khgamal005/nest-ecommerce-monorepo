'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // ✅ useRouter import for App Router
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../../store/authStore';
import axiosInstance from '../../../../utils/axiosInstance';

type LoginInputs = {
  email: string;
  password: string;
};

const LoginForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setClientSession = useAuthStore((state) => state.setClientSession);
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>();

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ✅ React Query — Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginInputs) => {
      const { data: json } = await axiosInstance.post('/api/auth/login', data, { requiresAuth: false } as any);
      return json;
    },

    onSuccess: (json) => {
      toast.success(json.message);

      useAuthStore.getState().setClientSession(true);
      if (json.user) {
        useAuthStore.getState().setUser(json.user);
        queryClient.setQueryData(['user'], json.user);
      }

      // Refresh server layout so SSR picks up the new cookies, then navigate.
      router.refresh();
      router.push('/');
    },

    onError: (err: any) => {
      // ✅ error toast
      toast.error(` ${err.message} || 'Login failed'`);
    },
  });
  const onSubmit = (data: LoginInputs) => {
    loginMutation.mutate(data);
  };

  return (
    <>
      <div className="w-full p-y">
        {/* Google Sign In - Top Section */}
        <div className="w-full max-w-md mx-auto mt-10 mb-4 px-2">
          <GoogleSignInButton callbackUrl={`/`} />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md mx-auto mt-0 p-6 shadow-lg border rounded-xl bg-white"
        >
          <h2 className="text-2xl font-semibold mb-5 text-center">
            تسجيل الدخول إلى حسابك
          </h2>

          {/* EMAIL */}
          <div className="mb-4">
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              {...register('email', { required: 'البريد الإلكتروني مطلوب' })}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-red-600 text-sm mt-1">{errors.email?.message}</p>
          </div>

          {/* PASSWORD */}
          <div className="mb-2 relative">
            <input
              type={passwordVisible ? 'text' : 'password'}
              placeholder="كلمة المرور"
              {...register('password', { required: 'كلمة المرور مطلوبة' })}
              className="border rounded px-3 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Toggle Icon Button */}
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
            >
              {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

            <p className="text-red-600 text-sm mt-1">
              {errors.password?.message}
            </p>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex justify-between items-center mb-4">
            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-sm text-gray-700"
              >
                تذكرني
              </label>
            </div>

            {/* Forgot Password */}
            <Link
              href="/auth/forget-password"
              className="text-sm text-blue-500 hover:underline"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending} // ✅ disable while loading
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 rounded-lg flex items-center justify-center font-medium transition-colors duration-200 mb-4"
          >
            {loginMutation.isPending && (
              <Loader2 className="animate-spin ml-2" />
            )}
            {loginMutation.isPending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          {/* BACKEND ERROR */}
          {serverError && (
            <p className="text-red-600 text-sm mb-3">{serverError}</p>
          )}

          {/* SUCCESS */}
          {successMessage && (
            <p className="text-green-600 text-sm mb-3">{successMessage}</p>
          )}

          {/* Register Link */}
          <p className="mt-4 text-center text-sm text-gray-600">
            ليس لديك حساب؟{' '}
            <Link
              href="/auth/register-user"
              className="text-blue-500 hover:underline font-medium"
            >
              إنشاء حساب
            </Link>
          </p>
        </form>
      </div>
    </>
  );
};

export default LoginForm;
