import IORedis from 'ioredis';

export const connection = new (IORedis as any)(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
});
