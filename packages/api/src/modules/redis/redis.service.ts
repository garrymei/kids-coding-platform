import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private cache: Map<string, { value: string; expiry?: number }> = new Map();

  async onModuleInit() {
    // 模拟Redis连接
    console.log('Redis service initialized (mock)');
  }

  async onModuleDestroy() {
    this.cache.clear();
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + ttl * 1000 : undefined;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<number> {
    return this.cache.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.cache.has(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    item.expiry = Date.now() + seconds * 1000;
    return true;
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.set(key, value, seconds);
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (current ? parseInt(current) : 0) + 1;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async decr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (current ? parseInt(current) : 0) - 1;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    // 简化的集合操作
    return members.length;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    // 简化的集合操作
    return members.length;
  }

  async scard(key: string): Promise<number> {
    // 简化的集合操作
    return 0;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    // 简化的有序集合操作
    return 1;
  }

  async zremrangebyscore(
    key: string,
    min: number,
    max: number,
  ): Promise<number> {
    // 简化的有序集合操作
    return 0;
  }

  async zcard(key: string): Promise<number> {
    // 简化的有序集合操作
    return 0;
  }

  async pipeline() {
    // 简化的pipeline操作
    return {
      zremrangebyscore: () => Promise.resolve(0),
      zcard: () => Promise.resolve(0),
      zadd: () => Promise.resolve(1),
      expire: () => Promise.resolve(true),
      exec: () => Promise.resolve([]),
    };
  }
}
