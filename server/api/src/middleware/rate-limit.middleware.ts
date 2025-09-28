import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  message: string; // 错误消息
  skipSuccessfulRequests?: boolean; // 是否跳过成功请求
  skipFailedRequests?: boolean; // 是否跳过失败请求
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly store: Map<string, RateLimitEntry> = new Map();
  private readonly configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    this.initializeConfigs();
    this.startCleanupInterval();
  }

  private initializeConfigs(): void {
    // 代码执行限制：10 req/min/学生
    this.configs.set('/execute', {
      windowMs: 60 * 1000, // 1分钟
      maxRequests: 10,
      message: '代码执行请求过于频繁，请稍后重试',
    });

    // 认证限制：5 req/min/IP
    this.configs.set('/auth', {
      windowMs: 60 * 1000, // 1分钟
      maxRequests: 5,
      message: '认证请求过于频繁，请稍后重试',
    });

    // 通用API限制：60 req/min/IP
    this.configs.set('/api', {
      windowMs: 60 * 1000, // 1分钟
      maxRequests: 60,
      message: '请求过于频繁，请稍后重试',
    });

    // 数据导出限制：10 req/hour/IP
    this.configs.set('/export', {
      windowMs: 60 * 60 * 1000, // 1小时
      maxRequests: 10,
      message: '数据导出请求过于频繁，请稍后重试',
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const config = this.getConfigForRoute(req.path);
    
    if (!config) {
      return next();
    }

    const key = this.generateKey(req, config);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // 创建新的限制条目
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      
      this.setRateLimitHeaders(res, 1, config.maxRequests, config.windowMs);
      return next();
    }

    if (entry.count >= config.maxRequests) {
      // 超过限制
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      this.setRateLimitHeaders(res, entry.count, config.maxRequests, config.windowMs, retryAfter);
      
      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: config.message,
          retryAfter,
          cid: this.generateCorrelationId(),
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // 增加计数
    entry.count++;
    this.store.set(key, entry);
    
    this.setRateLimitHeaders(res, entry.count, config.maxRequests, config.windowMs);
    next();
  }

  private getConfigForRoute(path: string): RateLimitConfig | null {
    // 按优先级匹配路由
    for (const [route, config] of this.configs) {
      if (path.startsWith(route)) {
        return config;
      }
    }
    
    return null;
  }

  private generateKey(req: Request, config: RateLimitConfig): string {
    // 对于代码执行，使用用户ID
    if (req.path.startsWith('/execute')) {
      const userId = req.headers['x-user-id'] || req.ip;
      return `rate_limit:execute:${userId}`;
    }
    
    // 对于认证，使用IP地址
    if (req.path.startsWith('/auth')) {
      return `rate_limit:auth:${req.ip}`;
    }
    
    // 对于数据导出，使用用户ID
    if (req.path.startsWith('/export')) {
      const userId = req.headers['x-user-id'] || req.ip;
      return `rate_limit:export:${userId}`;
    }
    
    // 默认使用IP地址
    return `rate_limit:api:${req.ip}`;
  }

  private setRateLimitHeaders(
    res: Response, 
    current: number, 
    limit: number, 
    windowMs: number,
    retryAfter?: number
  ): void {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());
    
    if (retryAfter) {
      res.setHeader('Retry-After', retryAfter);
    }
  }

  private startCleanupInterval(): void {
    // 每分钟清理过期的条目
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (now > entry.resetTime) {
          this.store.delete(key);
        }
      }
    }, 60 * 1000);
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取当前限制状态
   */
  getRateLimitStatus(key: string): {
    count: number;
    limit: number;
    remaining: number;
    resetTime: number;
  } | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    const config = this.getConfigForRoute(key.split(':')[1]);
    if (!config) {
      return null;
    }

    return {
      count: entry.count,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  /**
   * 重置限制
   */
  resetRateLimit(key: string): void {
    this.store.delete(key);
  }
}
