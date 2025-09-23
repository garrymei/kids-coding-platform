import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
// import type { TransportTargetOptions } from 'pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ClassesModule } from './modules/classes/classes.module';
import { RelationshipsModule } from './modules/relationships/relationships.module';
import { AuditModule } from './modules/audit/audit.module';
import { StudentsModule } from './modules/students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    ClassesModule,
    RelationshipsModule,
    AuditModule,
    StudentsModule,
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
            : (req.headers['x-user-id'] ?? null),
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
