'use client';

import { ReactNode } from 'react';
import useUser from '@/hooks/use-user';
import ProfileHeader from './_components/ProfileHeader';
import ProfileSidebar from './_components/ProfileSidebar';

const ProfileLayout = ({ children }: { children: ReactNode }) => {
  const { user, isLoading, logout } = useUser();

  if (isLoading)
    return (
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <div className="max-w-6xl mx-auto text-center text-gray-500">
          جاري تحميل الملف الشخصي...
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <div className="max-w-6xl mx-auto text-center text-gray-500">
          المستخدم غير موجود. يرجى تسجيل الدخول.
        </div>
      </div>
    );

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
      <div className="max-w-6xl mx-auto">
        <ProfileHeader user={user} logout={logout} />
        <div className="mt-8 flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 lg:flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 lg:p-3">
              <ProfileSidebar user={user} />
            </div>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
