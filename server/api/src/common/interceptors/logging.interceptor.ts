import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { LoggerService } from '../services/logger.service';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest() as any;
    const res = context.switchToHttp().getResponse() as any;
    const started = Date.now();
    
    // 提取请求信息
    const method = req.method;
    const url = req.url;
    const userId = req.user?.id || req.headers['x-user-id'];
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return next.handle().pipe(
      tap((response) => {
        const durationMs = Date.now() - started;
        
        // 记录路由访问日志
        this.logger.logRoute(
          method,
          url,
          durationMs,
          userId,
          {
            statusCode: res.statusCode,
            ip,
            userAgent: userAgent?.substring(0, 100) // 限制长度
          }
        );

        // 记录关键操作的审计日志
        this.logAuditForRoute(method, url, userId, response, ip, userAgent);
      }),
      catchError((error) => {
        const durationMs = Date.now() - started;
        
        // 记录错误日志
        this.logger.logWithUser(
          'error',
          'route_error',
          userId || 'anonymous',
          {
            method,
            url,
            durationMs,
            error: error.message,
            statusCode: error.status || 500,
            ip,
            userAgent: userAgent?.substring(0, 100)
          }
        );

        return throwError(() => error);
      })
    );
  }

  /**
   * 为特定路由记录审计日志
   */
  private logAuditForRoute(
    method: string,
    url: string,
    userId: string | undefined,
    response: any,
    ip?: string,
    userAgent?: string
  ): void {
    // 记录代码执行审计
    if (method === 'POST' && url === '/execute') {
      this.logger.auditCodeExecution(
        userId || 'anonymous',
        'code_execution',
        response?.source || '',
        response,
        ip,
        userAgent
      );
    }

    // 记录判题审计
    if (method === 'POST' && (url === '/judge' || url.startsWith('/judge/'))) {
      this.logger.auditJudging(
        userId || 'anonymous',
        response?.levelId || 'unknown',
        response?.gameType || 'unknown',
        response?.ok || false,
        ip,
        userAgent
      );
    }

    // 记录数据导出审计
    if (method === 'GET' && url.includes('/export')) {
      this.logger.auditDataExport(
        userId || 'anonymous',
        'data_export',
        url.split('/').pop(),
        ip,
        userAgent
      );
    }

    // 记录设置变更审计
    if (method === 'PUT' && url.includes('/settings')) {
      this.logger.auditSettingsChange(
        userId || 'anonymous',
        'user_settings',
        null, // 旧值需要从请求体中获取
        response,
        ip,
        userAgent
      );
    }
  }
}