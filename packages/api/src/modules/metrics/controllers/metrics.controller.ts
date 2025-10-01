import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import {
  RequirePermissions,
  Permission,
} from '../../auth/decorators/permissions.decorator';
import {
  MetricsService,
  StudentTrendData,
  StudentComparisonData,
  ComparisonRequest,
} from '../services/metrics.service';
import { AuditLoggerService } from '../../audit/services/audit-logger.service';

@ApiTags('metrics')
@Controller('metrics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Get('students/:id/trend')
  @RequirePermissions(Permission.VIEW_STUDENT_DATA)
  @ApiOperation({ summary: '获取学生成长趋势（纵向）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          time_spent_min: { type: 'number' },
          tasks_done: { type: 'number' },
          accuracy: { type: 'number' },
          xp: { type: 'number' },
          streak: { type: 'number' },
        },
      },
    },
  })
  @ApiQuery({
    name: 'from',
    description: '开始日期 (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'to',
    description: '结束日期 (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiQuery({
    name: 'granularity',
    description: '数据粒度',
    enum: ['day', 'week'],
    required: false,
  })
  async getStudentTrend(
    @Request() req,
    @Param('id') studentId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('granularity') granularity: 'day' | 'week' = 'day',
  ): Promise<StudentTrendData[]> {
    const requesterId = req.user.userId;
    
    // 记录审计日志
    await this.auditLogger.log({
      actorId: requesterId,
      action: 'view_student_trend',
      targetType: 'student',
      targetId: studentId,
      metadata: {
        from,
        to,
        granularity,
      },
      ip: req.ip,
    });

    return this.metricsService.getStudentTrend(
      requesterId,
      studentId,
      from,
      to,
      granularity,
    );
  }

  @Post('compare')
  @RequirePermissions(Permission.VIEW_STUDENT_DATA)
  @ApiOperation({ summary: '多学生对比（横向）' })
  @ApiResponse({
    status: 200,
    description: '对比成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          studentName: { type: 'string' },
          accuracy: { type: 'number' },
          tasks_done: { type: 'number' },
          time_spent_min: { type: 'number' },
          rank: { type: 'number' },
          isAnonymous: { type: 'boolean' },
        },
      },
    },
  })
  async compareStudents(
    @Request() req,
    @Body() comparisonRequest: ComparisonRequest,
  ): Promise<StudentComparisonData[]> {
    const requesterId = req.user.userId;
    
    // 记录审计日志
    await this.auditLogger.log({
      actorId: requesterId,
      action: 'compare_students',
      targetType: 'student',
      targetId: 'multiple',
      metadata: {
        studentIds: comparisonRequest.studentIds,
        metrics: comparisonRequest.metrics,
        window: comparisonRequest.window,
      },
      ip: req.ip,
    });

    return this.metricsService.compareStudents(requesterId, comparisonRequest);
  }

  @Get('students/:id/summary')
  @RequirePermissions(Permission.VIEW_STUDENT_DATA)
  @ApiOperation({ summary: '获取学生指标摘要' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        studentName: { type: 'string' },
        totalTimeSpent: { type: 'number' },
        totalTasksDone: { type: 'number' },
        averageAccuracy: { type: 'number' },
        totalXP: { type: 'number' },
        currentStreak: { type: 'number' },
        lastActiveDate: { type: 'string', format: 'date' },
      },
    },
  })
  async getStudentSummary(@Request() req, @Param('id') studentId: string) {
    const requesterId = req.user.userId;

    // 记录审计日志
    await this.auditLogger.log({
      actorId: requesterId,
      action: 'view_student_summary',
      targetType: 'student',
      targetId: studentId,
      metadata: {
        summaryType: '30_days',
      },
      ip: req.ip,
    });

    const data = await this.metricsService.getStudentSummary(requesterId, studentId);

    // 获取学生信息
    const student = await this.metricsService['prisma'].user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        displayName: true,
        nickname: true,
      },
    });

    if (!student) {
      throw new Error('学生不存在');
    }

    return {
      studentId: student.id,
      studentName: student.displayName,
      totalTimeSpent: data.time_spent_min,
      totalTasksDone: data.tasks_done,
      averageAccuracy: Math.round(data.accuracy * 100) / 100,
      totalXP: data.xp,
      currentStreak: data.streak,
      lastActiveDate:
        data.date?.toISOString().split('T')[0] || null,
    };
  }

  @Get('classes/:classId/overview')
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '获取班级指标概览' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        classId: { type: 'string' },
        className: { type: 'string' },
        studentCount: { type: 'number' },
        averageAccuracy: { type: 'number' },
        totalTasksDone: { type: 'number' },
        totalTimeSpent: { type: 'number' },
        topPerformers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studentId: { type: 'string' },
              studentName: { type: 'string' },
              accuracy: { type: 'number' },
              tasksDone: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getClassOverview(@Request() req, @Param('classId') classId: string) {
    const requesterId = req.user.userId;

    // 记录审计日志
    await this.auditLogger.log({
      actorId: requesterId,
      action: 'view_class_overview',
      targetType: 'class',
      targetId: classId,
      metadata: {
        timeWindow: '14_days',
      },
      ip: req.ip,
    });

    // 验证教师是否拥有该班级
    const classInfo = await this.metricsService['prisma'].class.findFirst({
      where: {
        id: classId,
        teacherId: requesterId,
        status: 'ACTIVE',
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              select: {
                id: true,
                displayName: true,
                nickname: true,
              },
            },
          },
        },
      },
    });

    if (!classInfo) {
      throw new Error('班级不存在或您没有权限访问');
    }

    const studentIds = classInfo.enrollments.map(
      (enrollment) => enrollment.student.id,
    );

    if (studentIds.length === 0) {
      return {
        classId: classInfo.id,
        className: classInfo.name,
        studentCount: 0,
        averageAccuracy: 0,
        totalTasksDone: 0,
        totalTimeSpent: 0,
        topPerformers: [],
      };
    }

    // 获取最近14天的数据
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 14);

    const classMetrics = await this.metricsService['prisma'].$queryRaw<
      Array<{
        student_id: string;
        accuracy: number;
        tasks_done: number;
        time_spent_min: number;
      }>
    >`
      SELECT 
        "studentId" as "student_id",
        AVG("accuracy") as "accuracy",
        SUM("tasksDone") as "tasks_done",
        SUM("timeSpentMin") as "time_spent_min"
      FROM "metrics_snapshots" 
      WHERE "studentId" = ANY(${studentIds})
        AND "date" >= ${startDate}
        AND "date" <= ${endDate}
      GROUP BY "studentId"
    `;

    // 计算班级统计
    const totalTasksDone = classMetrics.reduce(
      (sum, item) => sum + item.tasks_done,
      0,
    );
    const totalTimeSpent = classMetrics.reduce(
      (sum, item) => sum + item.time_spent_min,
      0,
    );
    const averageAccuracy =
      classMetrics.length > 0
        ? classMetrics.reduce((sum, item) => sum + item.accuracy, 0) /
          classMetrics.length
        : 0;

    // 获取表现最佳的学生
    const topPerformers = classMetrics
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5)
      .map((item) => {
        const student = classInfo.enrollments.find(
          (enrollment) => enrollment.student.id === item.student_id,
        )?.student;

        return {
          studentId: item.student_id,
          studentName: student?.displayName || '未知学生',
          accuracy: Math.round(item.accuracy * 100) / 100,
          tasksDone: item.tasks_done,
        };
      });

    return {
      classId: classInfo.id,
      className: classInfo.name,
      studentCount: studentIds.length,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      totalTasksDone,
      totalTimeSpent,
      topPerformers,
    };
  }
}