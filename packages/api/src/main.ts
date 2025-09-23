import { ArgumentsHost, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { initSentry, Sentry } from './sentry';
import { apiMetricsContentType, collectApiMetrics, observeRequestDuration } from './metrics';
import type { Request, Response } from 'express';

const sentryEnabled = initSentry();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

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
