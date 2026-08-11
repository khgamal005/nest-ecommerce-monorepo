'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Package,
  Bell,
  MapPin,
  Lock,
} from 'lucide-react';
import { User as UserType } from '@/types/user';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { ar: 'لوحة التحكم', href: '/profile', icon: LayoutDashboard },
  { ar: 'المعلومات الشخصية', href: '/profile/info', icon: User },
  { ar: 'الطلبات', href: '/profile/orders', icon: Package },
  { ar: 'التنبيهات', href: '/profile/notifications', icon: Bell },
  { ar: 'عناوين الشحن', href: '/profile/addresses', icon: MapPin },
  { ar: 'تغيير كلمة المرور', href: '/profile/password', icon: Lock },
];

const ProfileSidebar = ({ user }: { user: UserType }) => {
  const pathname = usePathname();

  return (
    <nav className="flex lg:flex-col gap-1 lg:gap-1.5 overflow-x-auto lg:overflow-visible">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/profile'
            ? pathname === '/profile'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 whitespace-nowrap px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.ar}</span>
            {item.href === '/profile/orders' &&
              user.orders?.length > 0 && (
                <span
                  className={cn(
                    'mr-auto text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 text-blue-700',
                  )}
                >
                  {user.orders.length}
                </span>
              )}
          </Link>
        );
      })}
    </nav>
  );
};

export default ProfileSidebar;
