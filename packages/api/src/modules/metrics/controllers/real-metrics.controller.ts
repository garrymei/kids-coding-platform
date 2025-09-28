import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission, PermissionType } from '../../auth/decorators/permissions.decorator';
import { RealMetricsService, TrendResponse, ComparisonResponse } from '../services/real-metrics.service';

@ApiTags('metrics')
@Controller('metrics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RealMetricsController {
  private readonly logger = new Logger(RealMetricsController.name);

  constructor(private readonly metricsService: RealMetricsService) {}

  @Get('students/:id/trend')
  @RequirePermission(PermissionType.STUDENT_DATA_ACCESS)
  @ApiOperation({ summary: '获取学生成长趋势（纵向）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        series: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dim: { type: 'string' },
              points: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    t: { type: 'string' },
                    v: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiQuery({ name: 'dims', description: '指标维度，逗号分隔', example: 'study_minutes,levels_completed' })
  @ApiQuery({ name: 'period', description: '时间粒度', enum: ['daily', 'weekly'] })
  @ApiQuery({ name: 'from', description: '开始日期 YYYY-MM-DD' })
  @ApiQuery({ name: 'to', description: '结束日期 YYYY-MM-DD' })
  async getStudentTrend(
    @Param('id') studentId: string,
    @Query('dims') dims: string,
    @Query('period') period: 'daily' | 'weekly' = 'daily',
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req,
  ): Promise<TrendResponse> {
    const startTime = Date.now();
    const requesterId = req.user.id;
    
    this.logger.log(`Getting trend for student ${studentId} by user ${requesterId}`);

    try {
      // TODO: Add permission check here
      // const hasAccess = await this.checkStudentAccess(requesterId, studentId);
      // if (!hasAccess) {
      //   throw new ForbiddenException('No access to student data');
      // }

      const dimsArray = dims.split(',').map(d => d.trim());
      
      const result = await this.metricsService.getStudentTrend(
        studentId,
        dimsArray,
        period,
        from,
        to,
      );

      const duration = Date.now() - startTime;
      this.logger.log(`Trend query completed in ${duration}ms`);

      return result;
    } catch (error) {
      this.logger.error('Failed to get student trend:', error);
      throw error;
    }
  }

  @Post('compare')
  @RequirePermission(PermissionType.CLASS_DATA_ACCESS)
  @ApiOperation({ summary: '获取班级学生对比数据（横向）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studentId: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getClassComparison(
    @Body() body: {
      classId: string;
      dims: string[];
      period: 'weekly';
      week: string; // YYYY-MM-DD (Monday)
    },
    @Request() req,
  ): Promise<ComparisonResponse> {
    const startTime = Date.now();
    const requesterId = req.user.id;
    
    this.logger.log(`Getting class comparison for class ${body.classId} by user ${requesterId}`);

    try {
      // TODO: Add permission check here
      // const hasAccess = await this.checkClassAccess(requesterId, body.classId);
      // if (!hasAccess) {
      //   throw new ForbiddenException('No access to class data');
      // }

      const result = await this.metricsService.getClassComparison(
        body.classId,
        body.dims,
        body.period,
        body.week,
      );

      const duration = Date.now() - startTime;
      this.logger.log(`Comparison query completed in ${duration}ms`);

      return result;
    } catch (error) {
      this.logger.error('Failed to get class comparison:', error);
      throw error;
    }
  }

  @Post('events')
  @RequirePermission(PermissionType.EVENT_RECORDING)
  @ApiOperation({ summary: '记录学习事件' })
  @ApiResponse({ status: 201, description: '事件记录成功' })
  async recordLearnEvent(
    @Body() body: {
      studentId: string;
      levelId: string;
      passed: boolean;
      timeMs?: number;
    },
    @Request() req,
  ): Promise<{ success: boolean }> {
    const requesterId = req.user.id;
    
    this.logger.log(`Recording learn event for student ${body.studentId} by user ${requesterId}`);

    try {
      // TODO: Add permission check here
      // const hasAccess = await this.checkStudentAccess(requesterId, body.studentId);
      // if (!hasAccess) {
      //   throw new ForbiddenException('No access to record events for this student');
      // }

      await this.metricsService.recordLearnEvent(
        body.studentId,
        body.levelId,
        body.passed,
        body.timeMs,
      );

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to record learn event:', error);
      throw error;
    }
  }
}
