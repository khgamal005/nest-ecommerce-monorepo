'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

type formInputs = {
  email: string;
  password: string;
};

const Page = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<formInputs>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const router = useRouter();
  const setAdmin = useAuthStore((s) => s.setAdmin);
  const setClientSession = useAuthStore((s) => s.setClientSession);
  const setLoggedOut = useAuthStore((s) => s.setLoggedOut);

  const loginMutation = useMutation({
    mutationFn: async (data: formInputs) => {
      const res = await axiosInstance.post('/api/auth/login', data, { requiresAuth: false } as any);
      return res.data;
    },
    
    onSuccess: (data) => {
      setLoggedOut(false);
      if (data?.user) setAdmin(data.user);
      setClientSession(true);
      toast.success(data.message);
      router.push('/dashboard');
      window.dispatchEvent(new Event('authChange'));
    },
    onError: (error: any) => {
      const fieldErrors = error.fieldErrors || [];
      const hasFieldError = fieldErrors.some((fe: any) =>
        ['email', 'password'].includes(fe.field)
      );

      if (hasFieldError) {
        fieldErrors.forEach((fe: any) => {
          if (fe.field === 'email' || fe.field === 'password') {
            setError(fe.field, { type: 'server', message: fe.message });
          }
        });
      }

      const errorMessage = error.message || 'Login failed';
      if (!hasFieldError) {
        toast.error(errorMessage);
        setServerError(errorMessage);
      }
    },
  });

  const onSubmit = (data: formInputs) => {
    setServerError(null);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-white/20"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Portal
            </h2>
            <p className="text-gray-600 text-sm">
              Sign in to access the admin dashboard
            </p>
          </div>

          {/* Email Field */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={passwordVisible ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 3,
                    message: 'Password must be at least 3 characters',
                  },
                })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Toggle password visibility"
              >
                {passwordVisible ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{serverError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-purple-300 disabled:to-blue-300 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {loginMutation.isPending && (
              <Loader2 className="animate-spin mr-2" size={20} />
            )}
            {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
          </button>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Secure access to administrative functions
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
