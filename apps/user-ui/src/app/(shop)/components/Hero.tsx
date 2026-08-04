import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Routes } from '@/constants/enums';

/**
 * Homepage hero banner.
 * The banner image is a placeholder — the admin will upload the real one
 * from the dashboard. Replace `bannerImage` with the actual asset URL once
 * the banner endpoint/file is available.
 */
const bannerImage = null; // TODO: admin uploads banner image later

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background */}
      <div
        className={`relative h-[420px] lg:h-[480px] ${
          bannerImage
            ? 'bg-cover bg-center'
            : 'bg-gradient-to-l from-[#3489FF] via-[#5a9dff] to-[#9dc4ff]'
        }`}
        style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#3489FF]/40 to-[#0f172a]/30" />

        {/* Content */}
        <div className="relative z-10 w-[90%] max-w-7xl mx-auto h-full flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            🏷️ عروض حصرية لفترة محدودة
          </span>

          <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg max-w-2xl">
            تسوق أفضل المنتجات
            <br />
            بأفضل الأسعار
          </h1>

          <p className="mt-4 text-white/90 text-base lg:text-lg max-w-xl">
            اكتشف تشكيلة واسعة من المنتجات المميزة مع توصيل سريع ودفع آمن
            وضمان الجودة.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={Routes.Products}
              className="inline-flex items-center gap-2 bg-white text-[#3489FF] font-semibold px-8 py-3.5 rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              تسوق الآن
              <ArrowLeft size={18} />
            </Link>
            <Link
              href={`/category/electronics`}
              className="inline-flex items-center gap-2 border-2 border-white/70 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              اكتشف الأقسام
            </Link>
          </div>
        </div>

        {/* Placeholder note — removed once admin uploads the banner */}
        {!bannerImage && (
          <div className="absolute bottom-3 left-3 z-10 bg-black/30 backdrop-blur-sm text-white/70 text-[11px] px-3 py-1.5 rounded-md">
            مساحة البانر — سيتم رفع الصورة من لوحة التحكم
          </div>
        )}
      </div>
    </section>
  );
}
