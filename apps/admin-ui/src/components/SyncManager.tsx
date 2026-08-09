'use client';

import React, { useEffect, useState } from 'react';
import { useSyncContext } from '../contexts/SyncContext';
import { updateQueueItem, removeFromQueue } from '../lib/offlineStorage';
import type { OfflineQueueItem } from '../lib/offlineStorage';

interface SyncManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncManager({ isOpen, onClose }: SyncManagerProps) {
  const { queueItems, syncStatus, syncNow, refreshQueue, isOnline, pendingCount, conflictCount, lastSyncAt } =
    useSyncContext();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshQueue();
    }
  }, [isOpen, refreshQueue]);

  const handleDismissConflict = async (item: OfflineQueueItem) => {
    setActionLoading(item.id!);
    try {
      await removeFromQueue(item.id!);
      await refreshQueue();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async (item: OfflineQueueItem) => {
    setActionLoading(item.id!);
    try {
      await updateQueueItem(item.id!, { status: 'pending', retries: item.retries + 1, errorReason: undefined });
      await refreshQueue();
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig: Record<
    OfflineQueueItem['status'],
    { color: string; label: string; badge: string }
  > = {
    pending: {
      color: 'text-amber-400',
      label: 'قيد الانتظار',
      badge: 'bg-amber-500/20 text-amber-300',
    },
    syncing: {
      color: 'text-blue-400',
      label: 'جاري المزامنة',
      badge: 'bg-blue-500/20 text-blue-300',
    },
    conflict: {
      color: 'text-red-400',
      label: 'تعارض',
      badge: 'bg-red-500/20 text-red-300',
    },
    done: {
      color: 'text-emerald-400',
      label: 'تم',
      badge: 'bg-emerald-500/20 text-emerald-300',
    },
  };

  const syncProgress =
    syncStatus === 'syncing' && queueItems.length > 0
      ? (queueItems.filter((i) => i.status === 'done').length / queueItems.length) * 100
      : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer — slides in from the right (RTL: from left) */}
      <div
        dir="rtl"
        className={`
          fixed top-0 right-0 z-50 h-full w-full max-w-md
          bg-gray-900 border-l border-gray-700/60
          shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/60 bg-gray-800/80">
          <div>
            <h2 className="text-lg font-bold text-white">مدير المزامنة</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {pendingCount > 0
                ? `${pendingCount} عملية قيد الانتظار`
                : conflictCount > 0
                ? `${conflictCount} تعارضات تحتاج مراجعة`
                : 'لا توجد عمليات معلقة'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sync Progress Bar */}
        {syncStatus === 'syncing' && (
          <div className="px-5 pt-3">
            <div className="flex items-center justify-between text-xs text-blue-400 mb-1">
              <span>جاري المزامنة...</span>
              <span>{Math.round(syncProgress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700/40">
          <button
            onClick={syncNow}
            disabled={!isOnline || syncStatus === 'syncing' || pendingCount === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500
              text-white text-sm font-medium transition-all duration-200"
          >
            <svg
              className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            مزامنة الآن
          </button>

          {lastSyncAt && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              آخر مزامنة:{' '}
              {lastSyncAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {queueItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">لا توجد عمليات معلقة</p>
            </div>
          ) : (
            queueItems
              .filter((i) => i.status !== 'done')
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((item) => {
                const cfg = statusConfig[item.status];
                const isLoading = actionLoading === item.id;
                return (
                  <div
                    key={item.id}
                    className={`
                      rounded-xl p-4 border transition-all duration-200
                      ${item.status === 'conflict'
                        ? 'bg-red-950/30 border-red-700/40'
                        : 'bg-gray-800/60 border-gray-700/40'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold text-white truncate">
                            {item.sku}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 space-y-0.5">
                          <div>الكمية: <span className="text-white font-medium">{item.qty}</span></div>
                          <div>
                            الوقت:{' '}
                            {new Date(item.timestamp).toLocaleString('ar-EG', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          {item.errorReason && (
                            <div className="text-red-400">
                              السبب: {item.errorReason}
                            </div>
                          )}
                          {item.retries > 0 && (
                            <div className="text-yellow-500">
                              محاولات: {item.retries}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions for conflict items */}
                      {item.status === 'conflict' && (
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleRetry(item)}
                            disabled={isLoading || !isOnline}
                            className="text-[11px] px-2 py-1 rounded-lg bg-violet-700 hover:bg-violet-600
                              disabled:opacity-50 text-white transition-colors"
                          >
                            إعادة المحاولة
                          </button>
                          <button
                            onClick={() => handleDismissConflict(item)}
                            disabled={isLoading}
                            className="text-[11px] px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600
                              disabled:opacity-50 text-gray-300 transition-colors"
                          >
                            تجاهل
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700/40 text-center">
          <p className="text-[11px] text-gray-600">
            {isOnline ? '🟢 متصل — يمكنك المزامنة الآن' : '🟡 غير متصل — ستتم المزامنة تلقائياً عند الاتصال'}
          </p>
        </div>
      </div>
    </>
  );
}
