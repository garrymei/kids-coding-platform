import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  blockDurationMs: number; // 封禁时长（毫秒）
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
  reason?: string;
}

@Injectable()
export class RateLimitService {
  private readonly searchRateLimitConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 10, // 最多10次搜索
    blockDurationMs: 15 * 60 * 1000, // 封禁15分钟
  };

  private readonly exportRateLimitConfig: RateLimitConfig = {
    windowMs: 60 * 60 * 1000, // 1小时
    maxRequests: 5, // 最多5次导出
    blockDurationMs: 60 * 60 * 1000, // 封禁1小时
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // 检查搜索限流
  async checkSearchRateLimit(
    userId: string,
    ipAddress: string,
  ): Promise<RateLimitResult> {
    const userKey = `search_rate_limit:user:${userId}`;
    const ipKey = `search_rate_limit:ip:${ipAddress}`;
    const blockKey = `search_blocked:${userId}:${ipAddress}`;

    // 检查是否被封禁
    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: 0,
        blocked: true,
        reason: '账号或IP已被封禁，请稍后再试',
      };
    }

    // 检查用户限流
    const userResult = await this.checkRateLimit(
      userKey,
      this.searchRateLimitConfig,
    );

    // 检查IP限流
    const ipResult = await this.checkRateLimit(
      ipKey,
      this.searchRateLimitConfig,
    );

    // 如果任一限流触发，则拒绝请求
    if (!userResult.allowed || !ipResult.allowed) {
      // 记录可疑行为
      await this.recordSuspiciousActivity(
        userId,
        ipAddress,
        'search_rate_limit',
      );

      // 如果连续触发限流，考虑封禁
      await this.checkForBlocking(userId, ipAddress);

      return {
        allowed: false,
        remaining: Math.min(userResult.remaining, ipResult.remaining),
        resetTime: Math.max(userResult.resetTime, ipResult.resetTime),
        blocked: false,
        reason: '搜索频率过高，请稍后再试',
      };
    }

    return {
      allowed: true,
      remaining: Math.min(userResult.remaining, ipResult.remaining),
      resetTime: Math.max(userResult.resetTime, ipResult.resetTime),
      blocked: false,
    };
  }

  // 检查导出限流
  async checkExportRateLimit(
    userId: string,
    ipAddress: string,
  ): Promise<RateLimitResult> {
    const userKey = `export_rate_limit:user:${userId}`;
    const ipKey = `export_rate_limit:ip:${ipAddress}`;
    const blockKey = `export_blocked:${userId}:${ipAddress}`;

    // 检查是否被封禁
    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: 0,
        blocked: true,
        reason: '导出功能已被封禁，请联系管理员',
      };
    }

    // 检查用户限流
    const userResult = await this.checkRateLimit(
      userKey,
      this.exportRateLimitConfig,
    );

    // 检查IP限流
    const ipResult = await this.checkRateLimit(
      ipKey,
      this.exportRateLimitConfig,
    );

    if (!userResult.allowed || !ipResult.allowed) {
      // 记录可疑行为
      await this.recordSuspiciousActivity(
        userId,
        ipAddress,
        'export_rate_limit',
      );

      return {
        allowed: false,
        remaining: Math.min(userResult.remaining, ipResult.remaining),
        resetTime: Math.max(userResult.resetTime, ipResult.resetTime),
        blocked: false,
        reason: '导出频率过高，请稍后再试',
      };
    }

    return {
      allowed: true,
      remaining: Math.min(userResult.remaining, ipResult.remaining),
      resetTime: Math.max(userResult.resetTime, ipResult.resetTime),
      blocked: false,
    };
  }

  // 通用限流检查
  private async checkRateLimit(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // 使用Redis的滑动窗口算法
    const pipeline = this.redis.pipeline();

    // 移除过期的请求记录
    pipeline.zremrangebyscore(key, 0, windowStart);

    // 获取当前窗口内的请求数
    pipeline.zcard(key);

    // 添加当前请求
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // 设置过期时间
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    const currentCount = results[1][1] as number;

    const remaining = Math.max(0, config.maxRequests - currentCount - 1);
    const resetTime = now + config.windowMs;

    return {
      allowed: currentCount < config.maxRequests,
      remaining,
      resetTime,
      blocked: false,
    };
  }

  // 记录可疑行为
  private async recordSuspiciousActivity(
    userId: string,
    ipAddress: string,
    activityType: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'suspicious_activity',
        targetType: 'security',
        targetId: `${userId}:${ipAddress}`,
        metadata: {
          activityType,
          ipAddress,
          timestamp: new Date().toISOString(),
          severity: 'warning',
        },
      },
    });
  }

  // 检查是否需要封禁
  private async checkForBlocking(
    userId: string,
    ipAddress: string,
  ): Promise<void> {
    const key = `suspicious_count:${userId}:${ipAddress}`;
    const count = await this.redis.incr(key);

    // 设置过期时间（24小时）
    await this.redis.expire(key, 24 * 60 * 60);

    // 如果可疑行为超过阈值，进行封禁
    if (count >= 5) {
      await this.blockUser(userId, ipAddress, 'repeated_rate_limit_violations');
    }
  }

  // 封禁用户
  async blockUser(
    userId: string,
    ipAddress: string,
    reason: string,
  ): Promise<void> {
    const blockKey = `search_blocked:${userId}:${ipAddress}`;
    const blockDuration = 15 * 60; // 15分钟

    await this.redis.setex(blockKey, blockDuration, reason);

    // 记录封禁日志
    await this.prisma.auditLog.create({
      data: {
        actorId: 'system',
        action: 'user_blocked',
        targetType: 'user',
        targetId: userId,
        metadata: {
          reason,
          ipAddress,
          blockDuration,
          timestamp: new Date().toISOString(),
          severity: 'critical',
        },
      },
    });
  }

  // 解封用户
  async unblockUser(userId: string, ipAddress: string): Promise<void> {
    const blockKey = `search_blocked:${userId}:${ipAddress}`;
    await this.redis.del(blockKey);

    // 记录解封日志
    await this.prisma.auditLog.create({
      data: {
        actorId: 'system',
        action: 'user_unblocked',
        targetType: 'user',
        targetId: userId,
        metadata: {
          ipAddress,
          timestamp: new Date().toISOString(),
          severity: 'info',
        },
      },
    });
  }

  // 检测撞库攻击
  async detectBruteForce(
    userId: string,
    ipAddress: string,
    searchPattern: string,
  ): Promise<boolean> {
    const key = `brute_force:${userId}:${ipAddress}`;
    const patternKey = `search_pattern:${userId}`;

    // 记录搜索模式
    await this.redis.sadd(patternKey, searchPattern);
    await this.redis.expire(patternKey, 60 * 60); // 1小时过期

    // 检查搜索模式数量
    const patternCount = await this.redis.scard(patternKey);

    // 如果搜索模式过多，可能是撞库攻击
    if (patternCount > 20) {
      await this.recordSuspiciousActivity(
        userId,
        ipAddress,
        'potential_brute_force',
      );
      await this.blockUser(userId, ipAddress, 'potential_brute_force_attack');
      return true;
    }

    return false;
  }

  // 获取限流状态
  async getRateLimitStatus(
    userId: string,
    ipAddress: string,
  ): Promise<{
    search: RateLimitResult;
    export: RateLimitResult;
  }> {
    const [searchResult, exportResult] = await Promise.all([
      this.checkSearchRateLimit(userId, ipAddress),
      this.checkExportRateLimit(userId, ipAddress),
    ]);

    return {
      search: searchResult,
      export: exportResult,
    };
  }
}
