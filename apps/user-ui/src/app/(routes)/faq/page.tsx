'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    q: 'كيف يمكنني طلب منتج؟',
    a: 'اختر المنتج الذي تريده، أضفه إلى السلة، ثم أكمل عملية الدفع بإدخال بياناتك واختيار طريقة الدفع المناسبة.',
  },
  {
    q: 'ما هي طرق الدفع المتاحة؟',
    a: 'نوفر الدفع عند الاستلام (COD)، وكذلك الدفع أونلاين عبر بطاقات الائتمان والمحافظ الإلكترونية.',
  },
  {
    q: 'كم تستغرق مدة التوصيل؟',
    a: 'عادة ما يتم الشحن خلال 3-5 أيام عمل من تأكيد الطلب، حسب المنطقة.',
  },
  {
    q: 'ما هي سياسة الإرجاع؟',
    a: 'يمكنك طلب استرجاع المبلغ خلال 14 يوماً من تاريخ استلام الطلب، بشرط أن يكون المنتج في حالته الأصلية.',
  },
  {
    q: 'كيف يمكنني تتبع طلبي؟',
    a: 'يمكنك متابعة حالة طلبك من خلال صفحة الطلبات في حسابك الشخصي بعد تسجيل الدخول.',
  },
  {
    q: 'هل الدفع عند الاستلام متاح؟',
    a: 'نعم، الدفع عند الاستلام متاح في معظم المناطق، مع خيارات أونلاين آمنة أيضاً.',
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-[90%] max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              الأسئلة الشائعة
            </h1>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setOpen(open === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-right"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  {open === index ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {open === index && (
                  <p className="px-4 pb-4 text-gray-600 text-sm leading-6">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}