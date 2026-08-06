import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const connection = new (IORedis as any)(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
});

export const userEventsQueue = new Queue('user-events', {
  connection,
  streams: { events: { maxLen: 100 } },
});



export const emailQueue = new Queue('emails', {
  connection,
  streams: { events: { maxLen: 100 } },
});

export const refundQueue = new Queue('refunds', {
  connection,
  streams: { events: { maxLen: 100 } },
});

export const orderPostProcessQueue = new Queue('order-post-process', {
  connection,
  streams: { events: { maxLen: 100 } },
});



export const videoQueue = new Queue('video-processing', {
  connection,
  streams: { events: { maxLen: 100 } },
});

export const mediaCleanupQueue = new Queue('media-cleanup', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

export const orphanCleanupQueue = new Queue('orphan-cleanup', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

export const stockDeductQueue = new Queue('stock-deduct', {
  connection,
  streams: { events: { maxLen: 100 } },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

export const tokenCleanupQueue = new Queue('token-cleanup', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

export const allQueues = [
  { name: 'user-events', queue: userEventsQueue },

  { name: 'emails', queue: emailQueue },
  { name: 'refunds', queue: refundQueue },
  { name: 'order-post-process', queue: orderPostProcessQueue },
  { name: 'video-processing', queue: videoQueue },
  { name: 'media-cleanup', queue: mediaCleanupQueue },
  { name: 'orphan-cleanup', queue: orphanCleanupQueue },
  { name: 'stock-deduct', queue: stockDeductQueue },
  { name: 'token-cleanup', queue: tokenCleanupQueue },
] as const;

export async function getQueueStatuses() {
  return Promise.all(
    allQueues.map(async ({ name, queue }) => {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);
      return { name, waiting, active, completed, failed };
    }),
  );
}
