import { User } from '@/types/user';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const avatarPath = '/images/about-me-cuate.png';

const ProfileHeader = ({
  user,
  logout,
}: {
  user: User;
  logout: () => void;
}) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/auth/login');
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 sm:p-6 rounded-xl shadow-sm gap-4 md:gap-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full md:w-auto text-center sm:text-right">
        <div className="shrink-0">
          <img
            src={avatarPath}
            alt="Avatar"
            width={80}
            height={80}
            className="rounded-full object-cover w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-gray-50 shadow-sm"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate mb-1">
            {user.name || 'مستخدم مجهول'}
          </h2>
          <p className="text-gray-500 text-sm sm:text-base truncate mb-3">
            {user.email}
          </p>

          {(() => {
            if (!user.createdAt) return null;
            const d = new Date(user.createdAt);
            if (isNaN(d.getTime())) return null;
            return (
              <div className="flex justify-center sm:justify-start gap-4 text-xs font-medium">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                  عضو منذ {d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-100">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:text-red-700 
               bg-red-50/50 hover:bg-red-50 border border-red-100 hover:border-red-200 rounded-xl 
               transition-all duration-200 disabled:opacity-50"
        >
          {isLoggingOut ? (
            <svg
              className="animate-spin h-4 w-4 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          )}
          <span>خروج</span>
        </button>

        <button
          onClick={() => router.push('/')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-blue-600 hover:text-blue-700 
               bg-blue-50/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 rounded-xl 
               transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>الرئيسية</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;
