import Link from 'next/link';
import {
  AtSign,
  Send,
  MessageCircle,
  Globe,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
} from 'lucide-react';

import { Routes } from '@/constants/enums';

const socials = [
  { icon: AtSign, href: 'https://x.com', label: 'منصة إكس' },
  { icon: Send, href: 'https://t.me', label: 'تيليغرام' },
  { icon: MessageCircle, href: 'https://wa.me', label: 'واتساب' },
  { icon: Globe, href: 'https://example.com', label: 'الموقع' },
];

const serviceLinks = [
  { title: 'تتبع الطلب', href: '/orders/track' },
  { title: 'الشحن والتوصيل', href: '/shipping' },
  { title: 'سياسة الإرجاع', href: '/returns' },
  { title: 'الدفع الآمن', href: '/payment' },
  { title: 'الأسئلة الشائعة', href: '/faq' },
];

const companyLinks = [
  { title: 'من نحن', href: '/about' },
  { title: 'اتصل بنا', href: '/contact' },
  { title: 'الشروط والأحكام', href: '/terms' },
  { title: 'سياسة الخصوصية', href: '/privacy' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-white mt-auto">
      {/* Trust badges */}
      <div className="border-b border-white/10 bg-[#111c31]">
        <div className="w-[90%] max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 py-6">
          {[
            {
              icon: Truck,
              title: 'توصيل سريع',
              desc: 'شحن خلال 3-5 أيام',
            },
            { icon: ShieldCheck, title: 'دفع آمن', desc: 'ضمان 100% للحماية' },
            { icon: RefreshCw, title: 'إرجاع مجاني', desc: 'خلال 14 يوماً' },
            { icon: Headphones, title: 'دعم 24/7', desc: 'فريق جاهز لخدمتك' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="w-8 h-8 text-[#3489FF]" />
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-xs text-white/60">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="w-[90%] max-w-7xl mx-auto py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand & contact */}
        <div>
          <h3 className="text-xl font-bold mb-4">متجرنا</h3>
          <p className="text-sm text-white/70 leading-6 mb-6">
            وجهتك الأولى للتسوق عبر الإنترنت. اكتشف أفضل المنتجات بأفضل
            الأسعار وجودة عالية.
          </p>

          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#3489FF]" size={18} />
              <span>الرياض، المملكة العربية السعودية</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#3489FF]" size={18} />
              <a href="mailto:support@shop.com" className="hover:text-white">
                support@shop.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#3489FF]" size={18} />
              <a href="tel:+966555555555" className="hover:text-white">
                +966 555 555 555
              </a>
            </li>
          </ul>

          <div className="flex items-center gap-3 mt-6">
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#3489FF] transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Shop links */}
        <div>
          <h4 className="text-sm font-semibold mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-8 after:h-[2px] after:bg-[#3489FF]">
            روابط تسوق
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link href={Routes.Home} className="hover:text-white transition-colors">
                الرئيسية
              </Link>
            </li>
            <li>
              <Link href={Routes.Products} className="hover:text-white transition-colors">
                المنتجات
              </Link>
            </li>
            <li>
              <Link href={Routes.Brands} className="hover:text-white transition-colors">
                العلامات التجارية
              </Link>
            </li>
            <li>
              <Link href={Routes.Offers} className="hover:text-white transition-colors">
                العروض
              </Link>
            </li>
            <li>
              <Link href={Routes.Orders} className="hover:text-white transition-colors">
                الطلبات
              </Link>
            </li>
          </ul>
        </div>

        {/* Service links */}
        <div>
          <h4 className="text-sm font-semibold mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-8 after:h-[2px] after:bg-[#3489FF]">
            خدمة العملاء
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            {serviceLinks.map((link) => (
              <li key={link.title}>
                <Link href={link.href} className="hover:text-white transition-colors">
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company links */}
        <div>
          <h4 className="text-sm font-semibold mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-8 after:h-[2px] after:bg-[#3489FF]">
            معلومات
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            {companyLinks.map((link) => (
              <li key={link.title}>
                <Link href={link.href} className="hover:text-white transition-colors">
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="w-[90%] max-w-7xl mx-auto py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} متجرنا. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              الخصوصية
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              الشروط
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}