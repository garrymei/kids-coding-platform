import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrometheusService } from '../../metrics/prometheus.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly prometheusService: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const method = request.method;
    const route = this.getRoutePath(request);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.prometheusService.recordHttpRequest(
            method,
            route,
            response.statusCode,
            duration
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          this.prometheusService.recordHttpRequest(
            method,
            route,
            statusCode,
            duration
          );
        },
      })
    );
  }

  private getRoutePath(request: any): string {
    // 获取路由路径，去除参数
    const route = request.route?.path || request.url;
    
    // 将参数路径转换为模式
    if (route.includes('/:')) {
      return route.replace(/\/:[^/]+/g, '/:param');
    }
    
    return route;
  }
}
