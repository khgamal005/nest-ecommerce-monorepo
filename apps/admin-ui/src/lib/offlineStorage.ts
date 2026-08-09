export type QueueStatus = 'pending' | 'syncing' | 'conflict' | 'done';

export interface OfflineQueueItem {
  id: string;
  sku: string;
  qty: number;
  timestamp: number;
  status: QueueStatus;
  retries: number;
  errorReason?: string;
}

export type QueueItemPatch = Partial<Omit<OfflineQueueItem, 'id'>>;

const STORAGE_KEY = 'admin-ui:offline-queue';

function readQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineQueueItem[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: OfflineQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable — ignore
  }
}

export async function getQueue(): Promise<OfflineQueueItem[]> {
  return readQueue();
}

export async function enqueueQueueItem(
  item: Omit<OfflineQueueItem, 'id' | 'timestamp'>,
): Promise<OfflineQueueItem> {
  const queue = readQueue();
  const entry: OfflineQueueItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  writeQueue([...queue, entry]);
  return entry;
}

export async function updateQueueItem(id: string, patch: QueueItemPatch): Promise<void> {
  const queue = readQueue();
  const updated = queue.map((item) => (item.id === id ? { ...item, ...patch } : item));
  writeQueue(updated);
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = readQueue();
  writeQueue(queue.filter((item) => item.id !== id));
}

export async function clearQueue(): Promise<void> {
  writeQueue([]);
}
