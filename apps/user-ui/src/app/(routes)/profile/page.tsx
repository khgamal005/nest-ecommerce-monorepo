'use client';

import Link from 'next/link';
import {
  User,
  Package,
  Bell,
  MapPin,
  Lock,
} from 'lucide-react';

const dashboardCards = [
  {
    title: 'المعلومات الشخصية',
    description: 'عرض وتعديل بياناتك الشخصية والبريد الإلكتروني',
    href: '/profile/info',
    icon: User,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    title: 'الطلبات',
    description: 'متابعة طلباتك وعرض التفاصيل وحالة الشحن',
    href: '/profile/orders',
    icon: Package,
    color: 'text-green-600 bg-green-50',
  },
  {
    title: 'التنبيهات',
    description: 'إدارة إشعارات الطلبات والتنبيهات',
    href: '/profile/notifications',
    icon: Bell,
    color: 'text-orange-600 bg-orange-50',
  },
  {
    title: 'عناوين الشحن',
    description: 'إضافة وتعديل عناوين الشحن المحفوظة',
    href: '/profile/addresses',
    icon: MapPin,
    color: 'text-red-600 bg-red-50',
  },
  {
    title: 'تغيير كلمة المرور',
    description: 'تحديث كلمة المرور الخاصة بحسابك بأمان',
    href: '/profile/password',
    icon: Lock,
    color: 'text-gray-600 bg-gray-100',
  },
];

const ProfilePage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          لوحة التحكم
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          مرحباً بك في حسابك، يمكنك الوصول إلى جميع أقسام الملف الشخصي من هنا.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${card.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                {card.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ProfilePage;
