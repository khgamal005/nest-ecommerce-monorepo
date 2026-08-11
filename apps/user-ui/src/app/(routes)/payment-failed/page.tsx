'use client';

import { useRouter } from 'next/navigation';

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-xl font-semibold text-red-600 mb-3">
        فشلت عملية الدفع
      </h2>
      <p className="text-gray-600 mb-6 font-medium">
        لم نتمكن من إتمام عملية الدفع. يرجى المحاولة مرة أخرى أو اختيار طريقة دفع مختلفة.
      </p>

      <button
        onClick={() => router.push('/cart')}
        className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        العودة للسلة
      </button>
    </div>
  );
}
