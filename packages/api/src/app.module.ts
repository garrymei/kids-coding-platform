import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        redact: ['req.headers.authorization'],
        genReqId: (req) => {
          const headerId = req.headers['x-trace-id'];
          if (Array.isArray(headerId)) return headerId[0];
          return headerId ?? randomUUID();
        },
        customProps: (req) => ({
          traceId: req.id,
          userId: Array.isArray(req.headers['x-user-id'])
            ? req.headers['x-user-id'][0]
            : req.headers['x-user-id'] ?? null,
        }),
        formatters: {
          level: (label) => ({ level: label }),
        },
      },
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
