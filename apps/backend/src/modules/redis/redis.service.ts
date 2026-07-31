import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  set(key: string, value: string | number): Promise<any>;
  set(key: string, value: string | number, mode: string): Promise<any>;
  set(key: string, value: string | number, mode: string, ttl: number): Promise<any>;
  set(key: string, value: string | number, mode?: string, ttl?: number): Promise<any> {
    if (mode !== undefined && ttl !== undefined) {
      return this.redis.set(key, value, mode as any, ttl);
    }
    if (mode !== undefined) {
      return this.redis.set(key, value, mode as any);
    }
    return this.redis.set(key, value);
  }

  async del(...keys: string[]): Promise<number> {
    return this.redis.del(...keys);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }
}
