'use client';

import { useStore } from '@/store';
import axiosInstance from '@/utils/axiosInstance';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type Status = 'LOADING' | 'PROCESSING' | 'PAID' | 'FAILED';

function SuccessContent() {
  const { clearCart } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get('sessionId');
  const paymentMethod = params.get('payment');
  const orderIds = params.get('orderIds');

  const [status, setStatus] = useState<Status>('LOADING');

  useEffect(() => {
    // Handle COD orders - no polling needed
    if (paymentMethod === 'cod' && orderIds) {
      setStatus('PAID');
      clearCart();
      return;
    }

    // Handle online payment orders - poll for status
    if (!sessionId) {
      setStatus('FAILED');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await axiosInstance.get(
          `/api/orders/status?sessionId=${sessionId}`,
        );

        // Accept both PAID and PENDING as success states
        if (res.data.status === 'PAID' || res.data.status === 'PENDING') {
          setStatus('PAID');
          clearCart();
          clearInterval(interval);
        } else {
          setStatus('PROCESSING');
        }
      } catch {
        setStatus('FAILED');
        clearInterval(interval);
      }
    }, 3000);

    // Call immediately on mount
    (async () => {
      try {
        const res = await axiosInstance.get(
          `/api/orders/status?sessionId=${sessionId}`,
        );

        // Accept both PAID and PENDING as success states
        if (res.data.status === 'PAID' || res.data.status === 'PENDING') {
          setStatus('PAID');
          clearCart();
          clearInterval(interval);
        } else {
          setStatus('PROCESSING');
        }
      } catch {
        setStatus('FAILED');
        clearInterval(interval);
      }
    })();

    return () => clearInterval(interval);
  }, [sessionId, paymentMethod, orderIds, clearCart]);

  /* ---------------- UI ---------------- */

  if (status === 'LOADING' || status === 'PROCESSING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full mb-4" />
        <h2 className="text-lg font-medium">جاري تأكيد عملية الدفع...</h2>
        <p className="text-sm text-gray-500">يرجى عدم إغلاق هذه الصفحة</p>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-red-600 mb-3">
          فشلت عملية الدفع
        </h2>
        <button
          onClick={() => router.push('/cart')}
          className="px-4 py-2 bg-black text-white rounded-lg"
        >
          العودة للسلة
        </button>
      </div>
    );
  }

  // Check if it's a COD order
  const isCOD = paymentMethod === 'cod';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-2xl font-semibold text-green-600 mb-3">
        {isCOD ? 'تم تقديم الطلب بنجاح ' : 'تمت عملية الدفع بنجاح '}
      </h2>
      <p className="text-gray-600 mb-6 font-medium">
        {isCOD
          ? 'لقد تم تقديم طلبك بنجاح. يمكنك الدفع نقداً عند استلام الطلب.'
          : 'لقد تم تقديم طلبك بنجاح.'}
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => router.push('/profile/orders')}
          className="px-4 py-2 bg-black text-white rounded-lg"
        >
          عرض الطلبات
        </button>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 border rounded-lg"
        >
          متابعة التسوق
        </button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full mb-4" />
          <h2 className="text-lg font-medium">جاري التحميل...</h2>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
