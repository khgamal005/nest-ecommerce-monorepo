'use client';

import { useEffect } from 'react';
import { isAccessTokenStale, refreshSession } from '@/utils/axiosInstance';
import { useAuthStore } from '@/store/authStore';

/**
 * Silently refreshes the access token when the user returns to a tab after
 * the access token has expired. Browsers throttle background timers, so we
 * rely on visibilitychange rather than setTimeout polling.
 */
export function SessionRefreshListener() {
  const clientSession = useAuthStore((state) => state.clientSession);
  const hasSession = clientSession;

  useEffect(() => {
    if (!hasSession) return;

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (!isAccessTokenStale()) return;
      void refreshSession();
    };

    document.addEventListener('visibilitychange', onVisible);
    // Also check once on mount (e.g. cold open after 1h idle).
    onVisible();

    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [hasSession]);

  return null;
}
