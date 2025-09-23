import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
import type { TransportTargetOptions } from 'pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
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
        transport: (() => {
          const isPretty = process.env.LOG_PRETTY === 'true';
          const logToFile = process.env.LOG_TO_FILE !== 'false';
          const logFilePath = process.env.LOG_FILE ?? 'logs/api.log';
          const level = process.env.LOG_LEVEL ?? 'info';
          const targets: TransportTargetOptions[] = [];

          if (isPretty) {
            targets.push({
              target: 'pino-pretty',
              options: {
                singleLine: false,
                translateTime: 'SYS:standard',
              },
              level,
            });
          } else {
            targets.push({
              target: 'pino/file',
              options: { destination: 1 },
              level,
            });
          }

          if (logToFile) {
            targets.push({
              target: 'pino/file',
              options: { destination: logFilePath, mkdir: true },
              level,
            });
          }

          return { targets };
        })(),
      },
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
