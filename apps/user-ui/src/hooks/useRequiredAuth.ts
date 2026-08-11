import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useUser from './use-user';

const useRequiredAuth = () => {
  const router = useRouter();
  const { user, isLoading, error } = useUser();

  useEffect(() => {
    // Only redirect if not loading and no user is found
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
};

export default useRequiredAuth;
