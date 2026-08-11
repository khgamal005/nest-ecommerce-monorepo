'use client';

import { Truck, MapPin, Package, Clock, AlertCircle } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-[90%] max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              الشحن والتوصيل
            </h1>
          </div>

          <div className="space-y-6">
            <p className="text-gray-600 text-lg leading-8">
              نوفر خدمة شحن سريعة وآمنة لجميع الطلبات مع إمكانية تتبع الشحنة
              حتى باب منزلك.
            </p>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                مدة التوصيل
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    المدن الرئيسية
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">1-3 أيام</p>
                  <p className="text-sm text-gray-500">عمل</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    باقي المناطق
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">3-5 أيام</p>
                  <p className="text-sm text-gray-500">عمل</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                مراحل الشحن
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: 'تأكيد الطلب',
                    desc: 'بعد إتمام الطلب، يصلك تأكيد فوري برسالة.',
                  },
                  {
                    title: 'تجهيز الشحنة',
                    desc: 'يتم تجهيز وتغليف المنتج خلال 24-48 ساعة.',
                  },
                  {
                    title: 'التسليم',
                    desc: 'تسلم شحنتك في الموعد المحدد مع إمكانية التتبع.',
                  },
                ].map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-800">
                  <strong>ملاحظة:</strong> تختلف مدة التوصيل حسب الموقع
                  الجغرافي وحالة الطقس والظروف العامة.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                رسوم الشحن
              </h2>
              <p className="text-gray-600 leading-7">
                تُحسب رسوم الشحن تلقائياً في صفحة السلة حسب عدد المنتجات
                والوجهة، وتظهر بوضوح قبل إتمام عملية الدفع.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}