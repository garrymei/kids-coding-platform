import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLoggerService } from '../../audit/services/audit-logger.service';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message: string;
}

@Injectable()
export class RateLimitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  // 搜索速率限制配置
  private readonly searchRateLimit: RateLimitConfig = {
    maxRequests: 5, // 每分钟最多5次搜索
    windowMs: 60 * 1000, // 1分钟窗口
    message: '搜索请求过于频繁，请稍后再试',
  };

  // 申请速率限制配置
  private readonly requestRateLimit: RateLimitConfig = {
    maxRequests: 3, // 每分钟最多3次申请
    windowMs: 60 * 1000, // 1分钟窗口
    message: '申请请求过于频繁，请稍后再试',
  };

  // 检查搜索速率限制
  async checkSearchRateLimit(
    identifier: string, // IP地址或用户ID
    identifierType: 'ip' | 'user',
  ): Promise<void> {
    await this.checkRateLimit(
      identifier,
      identifierType,
      'search',
      this.searchRateLimit,
    );
  }

  // 检查申请速率限制
  async checkRequestRateLimit(
    identifier: string,
    identifierType: 'ip' | 'user',
  ): Promise<void> {
    await this.checkRateLimit(
      identifier,
      identifierType,
      'request',
      this.requestRateLimit,
    );
  }

  // 通用速率限制检查
  private async checkRateLimit(
    identifier: string,
    identifierType: 'ip' | 'user',
    action: string,
    config: RateLimitConfig,
  ): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // 查询窗口期内的请求记录
    const recentRequests = await (this.prisma as any).auditLog.count({
      where: {
        action: `${action}_rate_limit_check`,
        metadata: {
          path: ['identifier'],
          equals: identifier,
        },
        ts: {
          gte: windowStart,
        },
      },
    });

    if (recentRequests >= config.maxRequests) {
      // 记录速率限制违规 - 只有当identifierType为'user'时才记录审计日志
      if (identifierType === 'user') {
        await (this.prisma as any).auditLog.create({
          data: {
            actorId: identifier,
            action: `${action}_rate_limit_exceeded`,
            targetType: 'rate_limit',
            targetId: identifier,
            metadata: {
              identifier,
              identifierType,
              action,
              requestCount: recentRequests,
              maxRequests: config.maxRequests,
              windowMs: config.windowMs,
              ip: undefined, // 当identifierType为'user'时，ip为undefined
            },
            ts: new Date(),
          },
        });
      }

      throw new HttpException(config.message, HttpStatus.TOO_MANY_REQUESTS);
    }

    // 记录当前请求
    await this.auditLogger.log({
      actorId: identifierType === 'user' ? identifier : 'system',
      action: `${action}_rate_limit_check`,
      targetType: 'rate_limit',
      targetId: identifier,
      metadata: {
        identifier,
        identifierType,
        action,
        requestCount: recentRequests + 1,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        ip: identifierType === 'ip' ? identifier : undefined,
      },
    });
  }

  // 获取速率限制状态
  async getRateLimitStatus(
    identifier: string,
    identifierType: 'ip' | 'user',
    action: string,
  ): Promise<{
    remaining: number;
    resetTime: Date;
    limit: number;
  }> {
    const config =
      action === 'search' ? this.searchRateLimit : this.requestRateLimit;
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    const recentRequests = await (this.prisma as any).auditLog.count({
      where: {
        action: `${action}_rate_limit_check`,
        metadata: {
          path: ['identifier'],
          equals: identifier,
        },
        ts: {
          gte: windowStart,
        },
      },
    });

    const remaining = Math.max(0, config.maxRequests - recentRequests);
    const resetTime = new Date(now.getTime() + config.windowMs);

    return {
      remaining,
      resetTime,
      limit: config.maxRequests,
    };
  }

  // 清理过期的速率限制记录
  async cleanupExpiredRateLimitRecords(): Promise<void> {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小时前

    await (this.prisma as any).auditLog.deleteMany({
      where: {
        action: {
          in: [
            'search_rate_limit_check',
            'request_rate_limit_check',
            'search_rate_limit_exceeded',
            'request_rate_limit_exceeded',
          ],
        },
        ts: {
          lt: cutoffTime,
        },
      },
    });
  }
}
