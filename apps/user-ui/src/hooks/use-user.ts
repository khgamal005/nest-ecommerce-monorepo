import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axiosInstance';
import { useEffect, useRef, useState } from 'react';
import { isProtected } from '@/utils/Protected';
import { User } from '@/types/user';

const fetchUser = async () => {
  const response = await axiosInstance.get('/api/auth/me', isProtected);
  return response.data.user;
};

const logoutUser = async (): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.post('/api/auth/logout');
  return response.data;
};

const useUser = () => {
  const queryClient = useQueryClient();
  const clientSession = useAuthStore((state) => state.clientSession);
  const storeUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const resetAuth = useAuthStore((state) => state.reset);
  const loggedOut = useAuthStore((state) => state.loggedOut);
  const setLoggedOut = useAuthStore((state) => state.setLoggedOut);
  const loggingOutRef = useRef(false);

  // Re-hydrate the session on hard reloads. The backend stores the token in an
  // httpOnly cookie (unreadable from JS) and may mirror it in localStorage, so
  // probe /api/auth/me once on mount instead of relying on in-memory zustand
  // state that resets on every page reload.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const shouldFetchUser = !loggedOut && (mounted || clientSession || !!storeUser);

  const {
    data: queryUser,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    enabled: shouldFetchUser,
    staleTime: 15 * 60 * 1000,
    gcTime: 90 * 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: (prev) => prev,
    retry: (failureCount, err: any) => {
      if (err?.response?.status === 401) return false;
      if (err?.response?.status === 429 && failureCount > 1) return false;
      return failureCount < 2;
    },
  });

  // Keep store in sync once the server responds; never wipe optimistic user on fetch error.
  useEffect(() => {
    if (queryUser) {
      setUser(queryUser);
      setLoggedOut(false);
      queryClient.setQueryData(['user'], queryUser);
    }
  }, [queryUser, setUser, setLoggedOut, queryClient]);

  // A 401 from the mount probe means the stored session is gone/invalid. Mark
  // it logged out so the disabled query doesn't keep hammering /api/auth/me on
  // window focus.
  useEffect(() => {
    if ((error as any)?.response?.status === 401) {
      setLoggedOut(true);
    }
  }, [error, setLoggedOut]);

  const cachedUser = queryClient.getQueryData<User>(['user']);
  const user = queryUser ?? storeUser ?? cachedUser ?? null;

  const sessionPending = shouldFetchUser && !user && isLoading;

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      loggingOutRef.current = true;
      setLoggedOut(true);
      resetAuth();
      queryClient.setQueryData(['user'], null);
      queryClient.removeQueries({ queryKey: ['user'] });
      queryClient.clear();
    },
  });

  const logout = async () => {
    loggingOutRef.current = true;
    queryClient.cancelQueries();
    try {
      await logoutMutation.mutateAsync();
    } catch {
      setLoggedOut(true);
      resetAuth();
      queryClient.setQueryData(['user'], null);
      queryClient.removeQueries({ queryKey: ['user'] });
      queryClient.clear();
    }
  };

  return {
    user,
    isLoading,
    isFetching,
    error,
    refetch,
    logout,
    isLoggingOut: logoutMutation.isPending,
    sessionPending,
    hasSession: shouldFetchUser,
  };
};

export default useUser;
export { useUser };
