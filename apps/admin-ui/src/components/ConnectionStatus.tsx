'use client';

import React, { useState } from 'react';
import { useSyncContext } from '../contexts/SyncContext';

/**
 * ConnectionStatus
 *
 * Fixed-position pill in the bottom-left corner that reflects the current
 * sync / network state. Clicking it when there are pending items opens the
 * SyncManager drawer (pass the toggle via onOpenManager prop).
 */

interface ConnectionStatusProps {
  onOpenManager?: () => void;
}

export default function ConnectionStatus({ onOpenManager }: ConnectionStatusProps) {
  const { isOnline, pendingCount, conflictCount, syncStatus, syncNow } = useSyncContext();
  const [expanded, setExpanded] = useState(false);

  // ─── Derived state ───

  const hasConflicts = conflictCount > 0;
  const hasPending = pendingCount > 0;

  type State = 'syncing' | 'conflict' | 'offline' | 'online';

  const currentState: State = (() => {
    if (syncStatus === 'syncing') return 'syncing';
    if (hasConflicts) return 'conflict';
    if (!isOnline) return 'offline';
    return 'online';
  })();

  const config: Record<
    State,
    { bg: string; ring: string; dot: string; label: string; sublabel?: string }
  > = {
    online: {
      bg: 'bg-emerald-950/80',
      ring: 'ring-emerald-500/40',
      dot: 'bg-emerald-400 animate-pulse',
      label: 'متصل',
      sublabel: syncStatus === 'synced' ? 'تمت المزامنة ✓' : undefined,
    },
    offline: {
      bg: 'bg-amber-950/80',
      ring: 'ring-amber-500/40',
      dot: 'bg-amber-400',
      label: 'غير متصل',
      sublabel: hasPending ? `${pendingCount} عملية قيد الانتظار` : 'يعمل محلياً',
    },
    syncing: {
      bg: 'bg-blue-950/80',
      ring: 'ring-blue-500/40',
      dot: 'bg-blue-400',
      label: 'جاري المزامنة...',
    },
    conflict: {
      bg: 'bg-red-950/80',
      ring: 'ring-red-500/40',
      dot: 'bg-red-400 animate-pulse',
      label: 'تعارضات',
      sublabel: `${conflictCount} تحتاج مراجعة`,
    },
  };

  const { bg, ring, dot, label, sublabel } = config[currentState];

  const handleClick = () => {
    if (hasPending || hasConflicts) {
      onOpenManager?.();
    } else {
      setExpanded((e) => !e);
    }
  };

  return (
    <div
      className="fixed bottom-4 left-4 z-50"
      dir="rtl"
    >
      <button
        onClick={handleClick}
        title={hasPending ? 'عرض قائمة الانتظار' : label}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full
          ${bg} backdrop-blur-md
          ring-1 ${ring}
          text-white text-xs font-medium
          transition-all duration-300 ease-in-out
          hover:scale-105 active:scale-95 cursor-pointer
          shadow-lg
        `}
      >
        {/* Status dot */}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />

        {/* Spinning icon while syncing */}
        {currentState === 'syncing' ? (
          <svg
            className="w-3 h-3 animate-spin text-blue-300 flex-shrink-0"
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
            />
          </svg>
        ) : null}

        <span>{label}</span>

        {/* Pending count badge */}
        {(hasPending || hasConflicts) && (
          <span
            className={`
              inline-flex items-center justify-center
              w-5 h-5 rounded-full text-[10px] font-bold
              ${hasConflicts ? 'bg-red-500' : 'bg-amber-500'} text-white
              flex-shrink-0
            `}
          >
            {pendingCount}
          </span>
        )}
      </button>

      {/* Sub-label pill */}
      {sublabel && (
        <div className="mt-1 text-center">
          <span className="text-[10px] text-gray-400 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {sublabel}
          </span>
        </div>
      )}

      {/* Manual sync button when online + idle */}
      {isOnline && !hasPending && !hasConflicts && syncStatus !== 'syncing' && expanded && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={syncNow}
            className="text-[10px] bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-full transition-colors"
          >
            مزامنة الآن
          </button>
        </div>
      )}
    </div>
  );
}
