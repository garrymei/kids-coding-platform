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
import { ParentsModule } from './modules/parents/parents.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { AdminModule } from './modules/admin/admin.module';
import { SearchModule } from './modules/search/search.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { ProgressModule } from './modules/progress/progress.module';
import { CacheModule } from './modules/cache/cache.module';
import { SecurityModule } from './modules/security/security.module';
import { JudgeModule } from './modules/judge/judge.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { LevelsModule } from './modules/levels/levels.module';

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
    ParentsModule,
    TeachersModule,
    AdminModule,
    SearchModule,
    MetricsModule,
    ProgressModule,
    CacheModule,
    SecurityModule,
    JudgeModule,
    AchievementsModule,
    LevelsModule,
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
