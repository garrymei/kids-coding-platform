import { ArgumentsHost, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { initSentry, Sentry } from './sentry';
import { apiMetricsContentType, collectApiMetrics, observeRequestDuration, observeExecuteTime } from './metrics';
import type { Request, Response } from 'express';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { StructuredLoggerService } from './middleware/structured-logger.service';
import { ErrorMiddleware } from './middleware/error.middleware';

const sentryEnabled = initSentry();

async function bootstrap() {
  let app;
  try {
    app = await NestFactory.create(AppModule);
  } catch (error) {
    console.error('Failed to create Nest application:', error.message);
    // In development mode, continue with a minimal app if database is not available
    if (process.env.NODE_ENV !== 'production') {
      console.log('Running in database-less mode for development');
      // We'll need to create a minimal app here
      return;
    }
    throw error;
  }
  
  const logger = app.get(Logger);
  const structuredLogger = new StructuredLoggerService(logger);
  
  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Add logging middleware (must be first)
  app.use(new LoggingMiddleware(structuredLogger).use.bind(new LoggingMiddleware(structuredLogger)));

  // Add error handling middleware (must be after logging)
  app.useGlobalFilters(new ErrorMiddleware(structuredLogger));

  const httpAdapterHost = app.get(HttpAdapterHost);
  const httpServer = httpAdapterHost.httpAdapter.getInstance();

  if (sentryEnabled) {
    class SentryExceptionFilter extends BaseExceptionFilter {
      catch(exception: unknown, host: ArgumentsHost) {
        Sentry.captureException(exception);
        super.catch(exception, host);
      }
    }
    app.useGlobalFilters(new SentryExceptionFilter(httpAdapterHost.httpAdapter));

    process.on('unhandledRejection', (reason) => {
      Sentry.captureException(reason);
    });
    process.on('uncaughtException', (error) => {
      Sentry.captureException(error);
    });
  }

  const config = new DocumentBuilder()
    .setTitle('Kids Coding Platform API')
    .setDescription('REST API for the Kids Coding Platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3000);

  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - started;
      const path = req.route?.path ?? req.path ?? req.url ?? 'unknown';
      observeRequestDuration(req.method, path, res.statusCode, durationMs);
    });
    next();
  });

  httpServer.get('/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', apiMetricsContentType);
    res.send(await collectApiMetrics());
  });

  await app.listen(port);
  logger.log({ msg: 'api_listening', port, service: 'kids-api' });
}
bootstrap();