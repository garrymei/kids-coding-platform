import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return this.client.expire(key, seconds);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.client.setEx(key, seconds, value);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sAdd(key, members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.sRem(key, members);
  }

  async scard(key: string): Promise<number> {
    return this.client.sCard(key);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.client.zAdd(key, { score, value: member });
  }

  async zremrangebyscore(
    key: string,
    min: number,
    max: number,
  ): Promise<number> {
    return this.client.zRemRangeByScore(key, min, max);
  }

  async zcard(key: string): Promise<number> {
    return this.client.zCard(key);
  }

  async pipeline() {
    return this.client.multi();
  }
}
