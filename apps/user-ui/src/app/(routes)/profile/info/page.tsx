'use client';

import useUser from '@/hooks/use-user';
import ProfileInfo from '../_components/ProfileInfo';

const ProfileInfoPage = () => {
  const { user, isLoading } = useUser();

  if (isLoading)
    return (
      <div className="text-center text-gray-500 py-12">
        جاري تحميل الملف الشخصي...
      </div>
    );
  if (!user) return null;

  return <ProfileInfo user={user} />;
};

export default ProfileInfoPage;
