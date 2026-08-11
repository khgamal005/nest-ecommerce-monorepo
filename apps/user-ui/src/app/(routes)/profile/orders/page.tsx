'use client';

import useUser from '@/hooks/use-user';
import ProfileOrders from '../_components/ProfileOrders';

const ProfileOrdersPage = () => {
  const { user, isLoading } = useUser();

  if (isLoading)
    return (
      <div className="text-center text-gray-500 py-12">
        جاري تحميل الطلبات...
      </div>
    );
  if (!user) return null;

  return <ProfileOrders user={user} />;
};

export default ProfileOrdersPage;
