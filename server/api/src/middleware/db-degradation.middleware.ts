import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getDatabaseManager } from '../config/db';
import { LoggerService } from '../common/services/logger.service';

@Injectable()
export class DatabaseDegradationMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const dbManager = getDatabaseManager(this.logger);
    const dbStatus = dbManager.getStatus();

    // 健康检查和静态路由始终允许通过
    if (this.isHealthCheckRoute(req.path) || this.isStaticRoute(req.path)) {
      return next();
    }

    // 如果数据库不可用，返回503错误
    if (!dbStatus.connected) {
      const errorCode = 'DB_UNAVAILABLE';
      const message = 'Database service is currently unavailable';
      const cid = this.generateCorrelationId();

      this.logger.error('Database unavailable - request blocked', {
        cid,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        dbError: dbStatus.lastError,
        retryCount: dbStatus.retryCount,
      });

      throw new HttpException(
        {
          code: errorCode,
          message,
          cid,
          details: {
            dbStatus: 'down',
            lastError: dbStatus.lastError,
            retryCount: dbStatus.retryCount,
            lastAttempt: dbStatus.lastAttempt,
          },
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    next();
  }

  private isHealthCheckRoute(path: string): boolean {
    return path.startsWith('/health') || path === '/metrics';
  }

  private isStaticRoute(path: string): boolean {
    // 静态资源路由，如文档、图标等
    return path.startsWith('/docs') || 
           path.startsWith('/static') || 
           path === '/favicon.ico' ||
           path === '/robots.txt';
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
