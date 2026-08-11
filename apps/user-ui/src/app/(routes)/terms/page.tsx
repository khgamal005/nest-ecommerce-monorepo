'use client';

import { FileText, AlertCircle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-[90%] max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              الشروط والأحكام
            </h1>
          </div>

          <div className="space-y-6">
            <p className="text-gray-600 text-lg leading-8">
              يرجى قراءة هذه الشروط بعناية قبل استخدام خدماتنا. باستخدامك
              للموقع فإنك توافق على الالتزام بهذه الشروط.
            </p>

            <div className="space-y-8">
              {[
                {
                  title: 'استخدام الموقع',
                  points: [
                    'يجب أن تكون قادراً قانوناً على إبرام عقد ملزم لاستخدام خدماتنا.',
                    'يمنع استخدام الموقع لأي غرض غير قانوني أو غير مصرح به.',
                    'أنت مسؤول عن الحفاظ على سرية بيانات حساباتك.',
                  ],
                },
                {
                  title: 'الطلبات والأسعار',
                  points: [
                    'جميع الأسعار معروضة بالجنيه المصري وتشمل الضرائب.',
                    'نحتفظ بحق تعديل الأسعار والمنتجات دون إشعار مسبق.',
                    'قد تتم مراجعة الأسعار قبل تأكيد الطلب لضمان الدقة.',
                  ],
                },
                {
                  title: 'الدفع',
                  points: [
                    'يتم الدفع إما عند الاستلام أو أونلاين عبر الوسائل المتاحة.',
                    'يتعين سداد كامل قيمة الطلب لإتمام عملية الشحن.',
                  ],
                },
                {
                  title: 'الاسترجاع والاسترداد',
                  points: [
                    'يمكن طلب الاسترجاع خلال 14 يوماً من استلام الطلب.',
                    'يجب أن يكون المنتج في حالته الأصلية لاسترداد المبلغ.',
                  ],
                },
              ].map((section, index) => (
                <section key={index}>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {section.title}
                  </h2>
                  <ul className="space-y-2">
                    {section.points.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-gray-600 text-sm leading-6"
                      >
                        <span className="text-blue-600 mt-1.5 shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-yellow-800">
                    <strong>آخر تحديث:</strong> قد نقوم بتحديث هذه الشروط من وقت
                    لآخر. يتم الإشعار بأي تغييرات عبر الموقع.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}