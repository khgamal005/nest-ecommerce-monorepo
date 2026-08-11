'use client';

import {
  Target,
  Eye,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-[90%] max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              من نحن
            </h1>
          </div>

          <div className="space-y-6">
            <p className="text-gray-600 text-lg leading-8">
              نحن في <span className="font-semibold">مهاود شوب</span> وجهتك
              الأولى للتسوق عبر الإنترنت. نقدم أفضل المنتجات بأفضل الأسعار
              وجودة عالية، مع تجربة تسوق سهلة وآمنة تلبي احتياجات جميع
              عملائنا.
            </p>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                رؤيتنا
              </h2>
              <p className="text-gray-600 leading-7">
                أن نكون المنصة الرائدة للتسوق الإلكتروني في المنطقة، من خلال
                توفير تجربة تسوق استثنائية تجمع بين الجودة والسعر المناسب
                وخدمة العملاء المتميزة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                مهمتنا
              </h2>
              <p className="text-gray-600 leading-7">
                تمكين عملائنا من الوصول إلى تشكيلة واسعة من المنتجات الأصلية
                بأسعار منافسة، وتوفير تجربة تسوق مريحة وآمنة من لحظة الطلب
                حتى الاستلام.
              </p>
            </section>

            <section className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: 'دفع آمن',
                  desc: 'حماية 100% لبياناتك ومعاملاتك',
                },
                {
                  icon: Truck,
                  title: 'توصيل سريع',
                  desc: 'شحن خلال 3-5 أيام عمل',
                },
                {
                  icon: RefreshCw,
                  title: 'إرجاع مجاني',
                  desc: 'خلال 14 يوماً من الاستلام',
                },
                {
                  icon: Headphones,
                  title: 'دعم 24/7',
                  desc: 'فريق جاهز لخدمتك على مدار الساعة',
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
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}