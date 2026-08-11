'use client';

import axiosInstance from '@/utils/axiosInstance';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

const CheckoutContent = () => {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('session_id');

  const [error, setError] = useState<string | null>(null);

  /* ---------------- VERIFY SESSION ---------------- */
  const verifySessionQuery = useQuery({
    queryKey: ['verify-payment-session', sessionId],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/api/payments/session/verify?sessionId=${sessionId}`,
        { headers: { 'Cache-Control': 'no-cache' } }
      );
      return res.data.session;
    },
    enabled: !!sessionId,
    staleTime: Infinity,
    retry: false,
  });

  /* ---------------- CREATE KASHIER PAYMENT ---------------- */
  const createPaymentMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await axiosInstance.post(
        '/api/payments/kashier/create',
        { sessionId }
      );
      return res.data;
    },
    retry: false,
    onSuccess: (data) => {
      if (data?.sessionUrl) {
          window.location.href = data.sessionUrl;
          return;
      }
      setError('فشل في بدء عملية الدفع');
    },
    onError: () => {
      setError('فشل في بدء عملية الدفع');
    },
  });

  /* ---------------- TRIGGER PAYMENT ONCE ---------------- */
  useEffect(() => {
    if (!verifySessionQuery.data) return;
    if (createPaymentMutation.isPending || createPaymentMutation.isSuccess)
      return;

    // ✅ Just pass sessionId — server handles amount from stored session
    // No amount calculation needed here; avoids any double-discount risk
    createPaymentMutation.mutate(sessionId!);
  }, [verifySessionQuery.data]);

  /* ---------------- LOADING UI ---------------- */
  if (verifySessionQuery.isLoading || createPaymentMutation.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
          <p className="text-sm text-gray-600">
            جاري تحويلك إلى صفحة الدفع الآمنة...
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- ERROR UI ---------------- */
  if (error || verifySessionQuery.isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-xl shadow-md max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            خطأ في الدفع
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {error === 'Failed to initialize payment'
              ? 'فشل في بدء عملية الدفع'
              : error === 'Failed to start payment'
              ? 'فشل في بدء عملية الدفع'
              : error || 'جلسة دفع غير صالحة أو منتهية'}
          </p>
          <button
            onClick={() => router.push('/cart')}
            className="px-4 py-2 rounded-lg bg-black text-white"
          >
            العودة للسلة
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
          <p className="text-sm text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
