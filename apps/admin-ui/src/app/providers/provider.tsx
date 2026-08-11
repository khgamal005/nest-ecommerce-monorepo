'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import useAuthStore, { AdminUser } from '../../store/authStore';

export default function ReactQueryProvider({
  children,
  initialAdmin,
  hasToken,
}: {
  children: React.ReactNode;
  initialAdmin?: AdminUser | null;
  hasToken?: boolean;
}) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });

    if (initialAdmin) {
      queryClient.setQueryData(['admin'], initialAdmin); // React Query cache
      useAuthStore.getState().setAdmin(initialAdmin); // Zustand (optimistic)
      useAuthStore.getState().setClientSession(true);
    } else if (hasToken) {
      useAuthStore.getState().setClientSession(true); // allow client fetch
    }
    return queryClient;
  });

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}