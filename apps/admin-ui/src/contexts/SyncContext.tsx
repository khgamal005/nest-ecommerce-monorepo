'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getQueue } from '../lib/offlineStorage';
import type { OfflineQueueItem } from '../lib/offlineStorage';

export type SyncStatus = 'idle' | 'syncing' | 'synced';

interface SyncContextValue {
  isOnline: boolean;
  pendingCount: number;
  conflictCount: number;
  syncStatus: SyncStatus;
  queueItems: OfflineQueueItem[];
  lastSyncAt: Date | null;
  syncNow: () => Promise<void>;
  refreshQueue: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const refreshQueue = useCallback(async () => {
    const items = await getQueue();
    setQueueItems(items);
  }, []);

  useEffect(() => {
    void refreshQueue();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshQueue]);

  const syncNow = useCallback(async () => {
    setSyncStatus('syncing');
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSyncStatus('synced');
    setLastSyncAt(new Date());
    await refreshQueue();
  }, [refreshQueue]);

  const pendingCount = useMemo(
    () => queueItems.filter((item) => item.status === 'pending' || item.status === 'syncing').length,
    [queueItems],
  );

  const conflictCount = useMemo(
    () => queueItems.filter((item) => item.status === 'conflict').length,
    [queueItems],
  );

  const value: SyncContextValue = useMemo(
    () => ({
      isOnline,
      pendingCount,
      conflictCount,
      syncStatus,
      queueItems,
      lastSyncAt,
      syncNow,
      refreshQueue,
    }),
    [isOnline, pendingCount, conflictCount, syncStatus, queueItems, lastSyncAt, syncNow, refreshQueue],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncContext(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}
