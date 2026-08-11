'use client';

import {
  ShieldCheck,
  Lock,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
} from 'lucide-react';

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-[90%] max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              الدفع الآمن
            </h1>
          </div>

          <div className="space-y-6">
            <p className="text-gray-600 text-lg leading-8">
              في <span className="font-semibold">مهاود شوب</span> نحرص على توفير
              تجربة دفع آمنة وموثوقة. جميع معاملاتك مشفرة ومحمية بأعلى معايير
              الأمان.
            </p>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                طرق الدفع المتاحة
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Banknote,
                    title: 'الدفع عند الاستلام',
                    desc: 'ادفع نقداً عند استلام طلبك مباشرة.',
                  },
                  {
                    icon: CreditCard,
                    title: 'البطاقات البنكية',
                    desc: 'فيزا وماستركارد بمعايير أمان عالية.',
                  },
                  {
                    icon: Smartphone,
                    title: 'المحافظ الإلكترونية',
                    desc: 'ادفع عبر محفظتك الإلكترونية بسهولة.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="border border-gray-200 rounded-lg p-4 flex items-start gap-3"
                  >
                    <Icon className="w-6 h-6 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{title}</h3>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                أمان معاملاتك
              </h2>
              <ul className="space-y-2">
                {[
                  'تشفير جميع البيانات ببروتوكول SSL/TLS',
                  'لا نقوم بتخزين بيانات بطاقاتك البنكية',
                  'التحقق من الهوية لجميع المدفوعات أونلاين',
                  'مراقبة مستمرة للكشف عن أي عمليات مشبوهة',
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}