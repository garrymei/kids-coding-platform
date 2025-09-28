import { Controller, Get, Post, Body, Param, Query, HttpException, HttpStatus, Request } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { TrendRequestDto } from './dto/trend-request.dto';
import { ComparisonRequestDto } from './dto/comparison-request.dto';
import { 
  TrendQueryParams, 
  CompareQueryParams,
  MetricDimension,
  TimePeriod
} from './types/metrics.types';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * 获取学生纵向趋势数据（旧版本，保持兼容性）
   * GET /metrics/students/{studentId}/trend-legacy
   */
  @Get('students/:studentId/trend-legacy')
  async getStudentTrend(
    @Param('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: 'day' | 'week'
  ) {
    try {
      const dto: TrendRequestDto = {
        studentId,
        from,
        to,
        granularity: granularity || 'day'
      };
      
      return await this.metricsService.getStudentTrend(dto);
    } catch (error) {
      throw new HttpException(
        'Failed to get student trend data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取学生横向对比数据（旧版本，保持兼容性）
   * POST /metrics/compare-legacy
   */
  @Post('compare-legacy')
  async getStudentComparison(@Body() dto: ComparisonRequestDto) {
    try {
      return await this.metricsService.getStudentComparison(dto);
    } catch (error) {
      throw new HttpException(
        'Failed to get student comparison data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 新的趋势 API - 支持多维度查询
   * GET /metrics/students/{studentId}/trend?dims=study_minutes,levels_completed&period=weekly&from=2025-08-01&to=2025-09-28
   */
  @Get('students/:studentId/trend')
  async getStudentTrendV2(
    @Param('studentId') studentId: string,
    @Query('dims') dims: string,
    @Query('period') period: TimePeriod,
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req: any
  ) {
    try {
      // 解析维度参数
      const dimsArray = dims.split(',').filter(d => d) as MetricDimension[];
      
      if (dimsArray.length === 0) {
        throw new HttpException('dims parameter is required', HttpStatus.BAD_REQUEST);
      }

      const params: TrendQueryParams = {
        studentId,
        dims: dimsArray,
        period: period || 'daily',
        from,
        to
      };

      // 获取用户ID（从请求头或认证信息中）
      const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';

      return await this.metricsService.getStudentTrendV2(params, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get student trend data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 新的对比 API - 班级横向对比
   * POST /metrics/compare
   */
  @Post('compare')
  async getClassComparison(
    @Body() body: {
      classId: string;
      dims: string[];
      period: TimePeriod;
      week: string;
    },
    @Request() req: any
  ) {
    try {
      const params: CompareQueryParams = {
        classId: body.classId,
        dims: body.dims as MetricDimension[],
        period: body.period,
        week: body.week
      };

      // 获取用户ID（从请求头或认证信息中）
      const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';

      return await this.metricsService.getClassComparison(params, userId);
    } catch (error) {
      throw new HttpException(
        'Failed to get class comparison data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取学生摘要数据
   * GET /metrics/students/{studentId}/summary
   */
  @Get('students/:studentId/summary')
  async getStudentSummary(@Param('studentId') studentId: string) {
    try {
      // 生成模拟摘要数据
      const summary = {
        studentId,
        studentName: `学生${studentId.slice(-4)}`,
        totalTimeSpent: Math.floor(Math.random() * 2000) + 500, // 500-2500分钟
        totalTasksDone: Math.floor(Math.random() * 200) + 50, // 50-250个任务
        averageAccuracy: Math.round((0.7 + Math.random() * 0.25) * 100) / 100, // 70%-95%
        totalXP: Math.floor(Math.random() * 5000) + 1000, // 1000-6000 XP
        currentStreak: Math.floor(Math.random() * 30) + 1, // 1-30天
        lastActiveDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      return summary;
    } catch (error) {
      throw new HttpException(
        'Failed to get student summary',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
