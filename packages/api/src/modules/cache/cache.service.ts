import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        this.redis.on('connect', () => {
          this.logger.log('Connected to Redis');
          this.isConnected = true;
        });

        this.redis.on('error', (error) => {
          this.logger.error('Redis connection error:', error);
          this.isConnected = false;
        });

        this.redis.on('close', () => {
          this.logger.warn('Redis connection closed');
          this.isConnected = false;
        });

        await this.redis.connect();
      } else {
        this.logger.warn('REDIS_URL not configured, using in-memory cache fallback');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}:`, error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.redis.del(...keys);
    } catch (error) {
      this.logger.error(`Failed to delete cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  async invalidateStudentCaches(studentId: string): Promise<void> {
    const patterns = [
      `trend:${studentId}:*`,
      `compare:*:${studentId}:*`,
    ];

    for (const pattern of patterns) {
      const deleted = await this.deletePattern(pattern);
      if (deleted > 0) {
        this.logger.log(`Invalidated ${deleted} cache entries for student ${studentId}`);
      }
    }
  }

  async invalidateClassCaches(classId: string): Promise<void> {
    const pattern = `compare:${classId}:*`;
    const deleted = await this.deletePattern(pattern);
    if (deleted > 0) {
      this.logger.log(`Invalidated ${deleted} cache entries for class ${classId}`);
    }
  }

  async getMetrics(key: string): Promise<{ hits: number; misses: number }> {
    if (!this.isConnected) {
      return { hits: 0, misses: 0 };
    }

    try {
      const hits = await this.redis.get(`cache:hits:${key}`) || '0';
      const misses = await this.redis.get(`cache:misses:${key}`) || '0';
      return {
        hits: parseInt(hits, 10),
        misses: parseInt(misses, 10),
      };
    } catch (error) {
      this.logger.error(`Failed to get cache metrics for ${key}:`, error);
      return { hits: 0, misses: 0 };
    }
  }

  async recordCacheHit(key: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.redis.incr(`cache:hits:${key}`);
    } catch (error) {
      this.logger.error(`Failed to record cache hit for ${key}:`, error);
    }
  }

  async recordCacheMiss(key: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.redis.incr(`cache:misses:${key}`);
    } catch (error) {
      this.logger.error(`Failed to record cache miss for ${key}:`, error);
    }
  }
}
