'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  Shield,
  Clock,
} from 'lucide-react';
import axiosInstance from '../../../utils/axiosInstance';

const StorageCleanupPage = () => {
  const [scanStatus, setScanStatus] = useState<'idle' | 'queued' | 'processing'>('idle');
  /** Matches `metadata.scanToken` on the audit row for the in-flight scan */
  const [pendingScanToken, setPendingScanToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Multipart cleanup
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post('/admin/api/cleanup-storage');
      return res.data;
    },
    onError: (error: any) => {
      console.error('Cleanup failed:', error);
    },
  });

  // Orphan scan
  const orphanScanMutation = useMutation({
    mutationFn: async ({ dryRun }: { dryRun: boolean }) => {
      const res = await axiosInstance.post('/admin/api/orphan-scan/trigger', { dryRun });
      return res.data as { scanToken?: string };
    },
    onSuccess: (data) => {
      setScanStatus('queued');
      if (data?.scanToken) setPendingScanToken(data.scanToken);
      queryClient.invalidateQueries({ queryKey: ['orphanScanLogs'] });
    },
  });

  const handleOrphanScan = (dryRun: boolean) => {
    setScanStatus('queued');
    setPendingScanToken(null);
    orphanScanMutation.mutate({ dryRun });
  };

  // Fetch latest orphan scan logs
  const { data: scanLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['orphanScanLogs'],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/api/orphan-scan/logs');
      return res.data.logs as Array<{
        id: string;
        action: string;
        createdAt: string;
        metadata: any;
      }>;
    },
    refetchInterval: scanStatus !== 'idle' ? 3000 : false,
  });

  // Detect when *this* scan completes: audit row carries the same scanToken from the trigger response
  useEffect(() => {
    if (scanStatus !== 'queued' || !pendingScanToken || !scanLogs?.length) return;
    const match = scanLogs.find(
      (l) =>
        l.metadata?.scanToken === pendingScanToken &&
        (l.metadata?.orphansFound !== undefined || l.action === 'ORPHAN_MEDIA_SCAN_FAILED')
    );
    if (match) {
      setScanStatus('idle');
      setPendingScanToken(null);
      setSessionRemovedKeys(new Set());
    }
  }, [scanLogs, scanStatus, pendingScanToken]);

  const deleteOrphanMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await axiosInstance.post('/admin/api/orphan-scan/delete-object', { key });
      return res.data as { success: boolean; key?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orphanScanLogs'] });
    },
  });

  /** Keys removed this session; hide from scan lists until a new dry run */
  const [sessionRemovedKeys, setSessionRemovedKeys] = useState<Set<string>>(() => new Set());

  const markKeyRemovedLocally = (key: string) => {
    setSessionRemovedKeys((prev) => new Set(prev).add(key));
  };

  const confirmDeleteOrphan = (key: string) => {
    if (
      !window.confirm(
        `Delete this object from R2 permanently?\n\n${key}\n\nThis cannot be undone. Ensure it is not needed.`
      )
    ) {
      return;
    }
    deleteOrphanMutation.mutate(key, {
      onSuccess: () => markKeyRemovedLocally(key),
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message || err?.message || 'Delete failed';
        window.alert(String(msg));
      },
    });
  };

  /** Only the newest dry run + newest live cleanup + latest failure; manual-delete lines kept as audit */
  const displayScanLogs = useMemo(() => {
    if (!scanLogs?.length) return [];
    let keptDryRun = false;
    let keptCleanup = false;
    let keptFailed = false;
    const filtered = scanLogs.filter((log) => {
      if (log.action === 'ORPHAN_MEDIA_DRY_RUN') {
        if (keptDryRun) return false;
        keptDryRun = true;
        return true;
      }
      if (log.action === 'ORPHAN_MEDIA_CLEANUP') {
        if (keptCleanup) return false;
        keptCleanup = true;
        return true;
      }
      if (log.action === 'ORPHAN_MEDIA_SCAN_FAILED') {
        if (keptFailed) return false;
        keptFailed = true;
        return true;
      }
      return true;
    });
    const dry = filtered.filter((l) => l.action === 'ORPHAN_MEDIA_DRY_RUN');
    const cleanup = filtered.filter((l) => l.action === 'ORPHAN_MEDIA_CLEANUP');
    const failed = filtered.filter((l) => l.action === 'ORPHAN_MEDIA_SCAN_FAILED');
    const manuals = filtered.filter((l) => l.action === 'ORPHAN_MEDIA_MANUAL_DELETE');
    return [...dry, ...cleanup, ...failed, ...manuals];
  }, [scanLogs]);

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Storage & Orphan Cleanup
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage R2 storage and scan for orphaned media files
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multipart Upload Cleanup */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Multipart Upload Cleanup</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">What this does:</h3>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Finds incomplete multipart uploads in R2</li>
                    <li>• Aborts abandoned uploads consuming space</li>
                  </ul>
                </div>
              </div>
            </div>
            <button
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cleanupMutation.isPending ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Cleaning up...</>
              ) : (
                <><Trash2 className="h-4 w-4" /> Start Cleanup</>
              )}
            </button>
          </div>
        </div>

        {/* Orphan Media Scan */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Orphan Media Scan</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900">What this does:</h3>
                  <ul className="text-sm text-amber-700 mt-2 space-y-1">
                    <li>• Scans R2 for files not in the database</li>
                    <li>• <strong>Dry Run:</strong> Shows the latest scan only — orphans you can delete one-by-one, or use Live Delete for all at once</li>
                    <li>• <strong>Live Delete:</strong> Removes every orphan found in that run (use with care)</li>
                    <li>• Older dry runs are hidden here; each new dry run replaces the list you see.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOrphanScan(true)}
                disabled={orphanScanMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="h-4 w-4" />
                Dry Run
              </button>
              <button
                onClick={() => handleOrphanScan(false)}
                disabled={orphanScanMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                Live Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Status */}
      {scanStatus !== 'idle' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
          <div>
            <p className="font-medium text-blue-900">Scan in progress...</p>
            <p className="text-sm text-blue-700">The worker is scanning your R2 bucket. Results will appear below shortly.</p>
          </div>
        </div>
      )}

      {/* Scan Results - Always shown when data exists */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Scan Results</h2>
            </div>
            <button
              onClick={() => refetchLogs()}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-6">
          {logsLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !scanLogs || scanLogs.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No scans run yet. Click <strong>Dry Run</strong> to start.</p>
            </div>
          ) : displayScanLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No results to display.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <p className="text-xs text-gray-500 mb-2">
                Showing the <strong>latest</strong> dry run and live cleanup only. Manual delete lines stay as an audit
                trail. Run <strong>Dry Run</strong> again after deletes to refresh the orphan list.
              </p>
              {displayScanLogs.map((log) => {
                if (log.action === 'ORPHAN_MEDIA_MANUAL_DELETE') {
                  const meta = log.metadata || {};
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 flex flex-wrap items-center justify-between gap-2"
                    >
                      <span>
                        <span className="font-semibold text-gray-800">Manual R2 delete</span>
                        {meta.r2Key ? (
                          <span className="ml-2 font-mono break-all">{String(meta.r2Key)}</span>
                        ) : null}
                      </span>
                      <span className="text-gray-500 shrink-0">
                        {new Date(log.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>
                  );
                }

                const isFailed = log.action === 'ORPHAN_MEDIA_SCAN_FAILED';
                const isDryRun = log.action === 'ORPHAN_MEDIA_DRY_RUN';
                const meta = log.metadata || {};
                const stats = meta.stats || {};
                const orphanList: string[] = Array.isArray(meta.orphanKeys)
                  ? meta.orphanKeys
                  : [];
                const visibleOrphans = orphanList.filter((k) => !sessionRemovedKeys.has(k));
                const orphanTotal =
                  typeof meta.orphanKeysTotal === 'number'
                    ? meta.orphanKeysTotal
                    : orphanList.length;

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${
                      isFailed
                        ? 'bg-amber-50 border-amber-300'
                        : isDryRun
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-semibold flex items-center gap-2 flex-wrap ${
                        isFailed
                          ? 'text-amber-900'
                          : isDryRun
                            ? 'text-blue-800'
                            : 'text-red-800'
                      }`}>
                        {isFailed
                          ? '⚠️ Scan failed'
                          : isDryRun
                            ? '🔍 Dry Run (latest)'
                            : '🗑️ Live Cleanup (latest)'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">{meta.orphansFound ?? 0}</div>
                        <div className="text-xs text-gray-500">Orphans Found</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">{meta.orphansDeleted ?? 0}</div>
                        <div className="text-xs text-gray-500">Deleted</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">{meta.totalR2Objects ?? 0}</div>
                        <div className="text-xs text-gray-500">Total R2 Files</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">{meta.totalDbReferences ?? 0}</div>
                        <div className="text-xs text-gray-500">DB References</div>
                      </div>
                    </div>

                    {stats.imagesWithKey !== undefined && (
                      <div className="bg-white rounded-lg p-3 mb-3">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Protected Files by Source:</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>📸 Images: <span className="font-medium">{stats.imagesWithKey}</span> {stats.imagesWithoutKey > 0 && <span className="text-red-500">(+{stats.imagesWithoutKey} missing r2_key)</span>}</div>
                          <div>🎬 Videos: <span className="font-medium">{stats.videosWithKey + stats.videosExtractedFromUrl}</span> {stats.videosUnresolvable > 0 && <span className="text-red-500">(+{stats.videosUnresolvable} not protected)</span>}</div>
                          <div>🏷️ Brands: <span className="font-medium">{stats.brands}</span></div>
                          <div>🏪 Shops: <span className="font-medium">{stats.shops}</span></div>
                        </div>
                      </div>
                    )}

                    {isFailed && meta.errorMessage && (
                      <div className="flex items-center gap-2 text-sm text-amber-900 bg-amber-100 rounded-lg p-3 mb-3">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {String(meta.errorMessage)}
                      </div>
                    )}

                    {isDryRun && !isFailed && visibleOrphans.length > 0 && (
                      <details open>
                        <summary className="text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                          Orphan files ({orphanTotal} in scan
                          {meta.orphanKeysTruncated
                            ? `, first ${orphanList.length} listed`
                            : ''}
                          {visibleOrphans.length < orphanList.length
                            ? ` — ${orphanList.length - visibleOrphans.length} removed this session`
                            : ''}
                          )
                        </summary>
                        <p className="text-xs text-gray-500 mt-2 mb-2">
                          Use <strong>Delete</strong> on each row to remove only that file from R2. The server blocks keys
                          still referenced in the database.
                        </p>
                        <div className="mt-2 space-y-1 max-h-96 overflow-y-auto bg-white rounded-lg p-2 border border-gray-100">
                          {visibleOrphans.map((key: string) => (
                            <div
                              key={key}
                              className="flex items-center gap-2 text-xs font-mono text-gray-800 bg-gray-50 px-2 py-2 rounded"
                            >
                              <span className="flex-1 min-w-0 break-all">{key}</span>
                              <button
                                type="button"
                                onClick={() => confirmDeleteOrphan(key)}
                                disabled={deleteOrphanMutation.isPending}
                                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete this object from R2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {!isDryRun && !isFailed && log.action === 'ORPHAN_MEDIA_CLEANUP' && visibleOrphans.length > 0 && (
                      <details>
                        <summary className="text-xs font-medium text-gray-600 cursor-pointer">
                          Objects from this cleanup run (read-only)
                        </summary>
                        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto bg-white rounded p-2 text-xs font-mono">
                          {visibleOrphans.map((key: string) => (
                            <div key={key} className="break-all text-gray-700">
                              {key}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {isDryRun && !isFailed && orphanList.length > 0 && visibleOrphans.length === 0 && !meta.orphanKeysTruncated && (
                      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        All keys from this scan that were listed have been removed from R2 this session. Run{' '}
                        <strong>Dry Run</strong> again to refresh the list.
                      </div>
                    )}

                    {!isFailed && meta.orphansFound === 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                        <CheckCircle className="h-4 w-4" />
                        No orphaned files found under scanned prefixes.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageCleanupPage;
