'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useRouter } from 'next/navigation';

const fetchAdmin = async () => {
  const response = await axiosInstance.get('/api/auth/me');
  return response.data?.user;
};

const logoutAdmin = async (): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.post('/api/auth/logout');
  return response.data;
};

export const useAdmin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: admin,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin'],
    queryFn: fetchAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Listen for auth changes (login/logout)
  useEffect(() => {
    const handleAuthChange = () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, [queryClient]);

  const logoutMutation = useMutation({
    mutationFn: logoutAdmin,
    onSuccess: () => {
      queryClient.setQueryData(['admin'], null);
      queryClient.removeQueries({ queryKey: ['admin'] });
      window.dispatchEvent(new Event('authChange'));
      router.push('/');
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      queryClient.setQueryData(['admin'], null);
      window.dispatchEvent(new Event('authChange'));
      router.push('/');
    },
  });

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return {
    admin,
    isLoading,
    error,
    refetch,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
};

export default useAdmin;
