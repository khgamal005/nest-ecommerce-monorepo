'use client';

import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-[90%] max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              سياسة الخصوصية
            </h1>
          </div>

          <div className="space-y-6">
            <p className="text-gray-600 text-lg leading-8">
              نحن في <span className="font-semibold">مهاود شوب</span> نحترم
              خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع
              بياناتك واستخدامها وحمايتها.
            </p>

            <div className="space-y-8">
              {[
                {
                  icon: Database,
                  title: 'البيانات التي نجمعها',
                  points: [
                    'الاسم والبريد الإلكتروني ورقم الهاتف عند إنشاء الحساب.',
                    'عناوين الشحن والفواتير لتوصيل الطلبات.',
                    'بيانات الطلبات وسجل المشتريات.',
                  ],
                },
                {
                  icon: Eye,
                  title: 'كيف نستخدم بياناتك',
                  points: [
                    'معالجة الطلبات وإتمام عمليات الدفع والتوصيل.',
                    'تحسين تجربة التصفح وتخصيص العروض.',
                    'التواصل معك بخصوص طلباتك وخدمة العملاء.',
                  ],
                },
                {
                  icon: Lock,
                  title: 'حماية البيانات',
                  points: [
                    'جميع البيانات مشفرة أثناء النقل ببروتوكول SSL/TLS.',
                    'لا نشارك بياناتك مع أطراف ثالثة إلا لتشغيل الخدمة.',
                    'نطبق إجراءات أمنية صارمة لمنع الوصول غير المصرح به.',
                  ],
                },
                {
                  icon: ShieldCheck,
                  title: 'حقوقك',
                  points: [
                    'يمكنك طلب الاطلاع على بياناتك أو تعديلها أو حذفها.',
                    'يمكنك إلغاء الاشتراك في الرسائل التسويقية في أي وقت.',
                  ],
                },
              ].map(({ icon: Icon, title, points }, index) => (
                <section key={index}>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Icon className="w-5 h-5 text-blue-600" />
                    {title}
                  </h2>
                  <ul className="space-y-2">
                    {points.map((point, i) => (
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}