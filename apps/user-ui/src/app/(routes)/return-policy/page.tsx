'use client';

import {
  CheckCircle,
  Clock,
  RotateCcw,
  Shield,
  AlertCircle,
} from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-[90%] max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <RotateCcw className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              سياسة الاسترجاع والإرجاع
            </h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 text-lg mb-8">
              نحن في <span className="font-semibold">مهاود شوب</span> نحرص على
              رضاكم التام. تعرف على تفاصيل عملية الاسترجاع والمبالغ المستردة.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-800">
                  <strong>ملاحظة مهمة:</strong> يمكنك طلب استرجاع للمبلغ المدفوع
                  خلال <strong>14 يوماً</strong> من تاريخ استلام الطلب.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  مراحل عملية الاسترجاع
                </h2>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        طلب الاسترجاع
                      </h3>
                      <p className="text-gray-600 text-sm">
                        بعد استلام المنتج، سيظهر زر في صفحة تفاصيل الطلب يمكنك
                        من خلاله طلب الاسترجاع وذكر السبب. يمكنك طلب الارجاع
                        خلال <strong>14 يوماً</strong> من تاريخ الاستلام.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        قيد المراجعة
                      </h3>
                      <p className="text-gray-600 text-sm">
                        فريقنا يقوم بمراجعة طلبك والتأكد من استيفاء الشروط
                        المطلوبة. تستغرق المراجعة من 1-3 أيام عمل.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        الموافقة على الاسترجاع
                      </h3>
                      <p className="text-gray-600 text-sm">
                        بمجرد الموافقة على طلبك، ستتلقى إشعاراً عبر الواتساب
                        ورقم التتبع لإرجاع المنتج.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        إتمام عملية الاسترجاع
                      </h3>
                      <p className="text-gray-600 text-sm">
                        بعد استلام المنتج المرتجع والتأكد من حالته، يتم تحويل
                        المبلغ إلى محفظتك أو طريقة الدفع الأصلية خلال 5-7 أيام
                        عمل.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  المدة الزمنية
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      طلب الاسترجاع
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">14 يوماً</p>
                    <p className="text-sm text-gray-500">
                      من تاريخ استلام الطلب
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      مراجعة الطلب
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">1-3 أيام</p>
                    <p className="text-sm text-gray-500">أيام عمل</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      استرداد المبلغ
                    </h3>
                    <p className="text-sm text-gray-500">بعد استلام المنتج</p>
                  </div>

                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  شروط الاسترجاع
                </h2>
                <ul className="space-y-3">
                  {[
                    // 'تأكد من صفحة المنتج - قد يضع التاجر شرط "غير قابل للإرجاع" على بعض المنتجات',
                    'المنتج يجب أن يكون في حالته الأصلية مع جميع الملحقات',
                    // 'المنتجات المخصصة أو المعدلة لا يمكن إرجاعها',
                    // 'المنتجات المستهلكة (مثل مستحضرات التجميل المفتوحة) لا تقبل الإرجاع',
                    'المنتجات التي تم إتلافها بسبب سوء الاستخدام لا تشملها سياسة الإرجاع',
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-gray-700"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-orange-600" />
                  طرق الاسترداد المتاحة
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">
                      المحفظة الإلكترونيةاو انستاباى
                    </span>
                    <span className="text-sm text-green-600">
                      الأسرع - خلال 24 ساعة
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">
                      البطاقة البنكية
                    </span>
                    <span className="text-sm text-gray-600">5-7 أيام عمل</span>
                  </div>
                </div>
              </section>

              <section className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  هل تحتاج مساعدة؟
                </h2>
                <p className="text-gray-600 mb-4">
                  فريق خدمة العملاء لدينا متاح لمساعدتك في أي استفسار بخصوص
                  طلبات الاسترجاع.
                </p>
                {/* <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>تواصل معنا</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="https://wa.me/201229705511"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span>تواصل عبر واتساب</span>
                  </a>
                </div> */}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
