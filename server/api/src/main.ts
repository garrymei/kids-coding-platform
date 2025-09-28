import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor.js';
import { LoggerService } from './common/services/logger.service.js';
import { PrometheusService } from './metrics/prometheus.service.js';
import { getDatabaseManager } from './config/db.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 获取服务实例并注入到拦截器
  const loggerService = app.get(LoggerService);
  const prometheusService = app.get(PrometheusService);
  
  app.useGlobalInterceptors(
    new LoggingInterceptor(loggerService),
    new MetricsInterceptor(prometheusService)
  );
  
  // 初始化数据库连接
  const dbManager = getDatabaseManager(loggerService);
  const dbConnected = await dbManager.connect();
  
  if (!dbConnected) {
    loggerService.warn('Database connection failed, starting in degraded mode', {
      willRetry: true,
      retryInterval: '30s'
    });
    
    // 启动后台重连
    dbManager.startReconnectLoop();
  } else {
    loggerService.info('Database connected successfully');
  }
  
  app.enableCors();
  await app.listen(3000);
  
  loggerService.info('API server started', {
    port: 3000,
    dbConnected,
    version: process.env.APP_VERSION || '1.0.0',
    commit: process.env.GIT_COMMIT || 'unknown'
  });
  
  console.log('API listening on http://localhost:3000');
  console.log(`Database status: ${dbConnected ? 'Connected' : 'Degraded mode'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});