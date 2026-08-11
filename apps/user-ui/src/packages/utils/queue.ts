interface QueueJob {
  id?: string;
  [key: string]: unknown;
}

/**
 * Lightweight local stand-in for the BullMQ user-events queue.
 * The real queue lives on the backend; here we keep the same API surface so
 * the client actions never throw, while events are simply no-ops client-side.
 */
export const userEventsQueue = {
  async add(name: string, _data: Record<string, unknown>, _opts?: unknown): Promise<QueueJob> {
    if (typeof console !== 'undefined') {
      console.debug(`[user-events] queue "${name}" (no-op, event not persisted)`);
    }
    return { id: `local-${Date.now()}` };
  },
};
