'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/authStore';

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
  const storeAdmin = useAuthStore((s) => s.admin);
  const clientSession = useAuthStore((s) => s.clientSession);
  const loggedOut = useAuthStore((s) => s.loggedOut);
  const setLoggedOut = useAuthStore((s) => s.setLoggedOut);
  const setAdmin = useAuthStore((s) => s.setAdmin);
  const setClientSession = useAuthStore((s) => s.setClientSession);

  const shouldFetchAdmin = !loggedOut && (clientSession || !!storeAdmin);

  const {
    data: queryAdmin,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin'],
    queryFn: fetchAdmin,
    enabled: shouldFetchAdmin,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Furthest any consumer needs to draw from: query -> store -> cache.
  const admin =
    queryAdmin ?? storeAdmin ?? queryClient.getQueryData(['admin']) ?? null;

  const sessionPending = shouldFetchAdmin && !admin && isLoading;

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
      setAdmin(null);
      setClientSession(false);
      setLoggedOut(true);
      window.dispatchEvent(new Event('authChange'));
      router.push('/');
    },
    onError: (err) => {
      console.error('Logout failed:', err);
      queryClient.setQueryData(['admin'], null);
      setAdmin(null);
      setClientSession(false);
      setLoggedOut(true);
      window.dispatchEvent(new Event('authChange'));
      router.push('/');
    },
  });

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return useMemo(
    () => ({
      admin,
      isLoading,
      sessionPending,
      error,
      refetch,
      logout,
      isLoggingOut: logoutMutation.isPending,
    }),
    [admin, isLoading, sessionPending, error, refetch, logoutMutation.isPending]
  );
};

export default useAdmin;