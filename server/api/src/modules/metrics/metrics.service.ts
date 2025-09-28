import { Injectable } from '@nestjs/common';
import { TrendRequestDto, TrendResponse, TrendDataPoint } from './dto/trend-request.dto';
import { ComparisonRequestDto, ComparisonResponse, ComparisonItem, ClassPercentiles } from './dto/comparison-request.dto';
import { 
  TrendQueryParams, 
  TrendResponse as NewTrendResponse, 
  CompareQueryParams, 
  CompareResponse,
  MetricDimension,
  TimePeriod
} from './types/metrics.types';
import { DemoDataGenerator, generateClassStudents } from './demo/demo-data-generator';
import { MetricsCacheService } from './cache/metrics-cache.service';
import { MetricsAuthService } from './auth/metrics-auth.service';

@Injectable()
export class MetricsService {
  constructor(
    private readonly cacheService: MetricsCacheService,
    private readonly authService: MetricsAuthService
  ) {}

  /**
   * 新的趋势 API - 支持多维度查询
   * GET /metrics/students/{studentId}/trend?dims=study_minutes,levels_completed&period=weekly&from=2025-08-01&to=2025-09-28
   */
  async getStudentTrendV2(
    params: TrendQueryParams, 
    userId: string
  ): Promise<NewTrendResponse> {
    // 权限验证
    const userRole = await this.authService.getUserRole(userId);
    await this.authService.checkMetricsAccess(userId, userRole, 'trend', params.studentId);

    // 检查缓存
    const cached = this.cacheService.get<NewTrendResponse>('trend', params);
    if (cached) {
      return cached;
    }

    // 生成数据
    const generator = new DemoDataGenerator(params.studentId);
    const result = generator.generateTrendData(
      params.studentId,
      params.dims,
      params.period,
      params.from,
      params.to
    );

    // 缓存结果（5分钟）
    this.cacheService.set('trend', params, result, 5);

    return result;
  }

  /**
   * 新的对比 API - 班级横向对比
   * POST /metrics/compare
   */
  async getClassComparison(
    params: CompareQueryParams, 
    userId: string
  ): Promise<CompareResponse> {
    // 权限验证
    const userRole = await this.authService.getUserRole(userId);
    await this.authService.checkMetricsAccess(userId, userRole, 'compare', params.classId);

    // 检查缓存
    const cached = this.cacheService.get<CompareResponse>('compare', params);
    if (cached) {
      return cached;
    }

    // 生成数据
    const generator = new DemoDataGenerator('class_' + params.classId);
    const result = generator.generateCompareData(
      params.classId,
      params.dims,
      params.period,
      params.week,
      10 // 默认10个学生
    );

    // 缓存结果（5分钟）
    this.cacheService.set('compare', params, result, 5);

    return result;
  }

  /**
   * 获取学生纵向趋势数据（旧版本，保持兼容性）
   * 当前返回模拟数据，后续可接入真实数据库
   */
  async getStudentTrend(dto: TrendRequestDto): Promise<TrendResponse> {
    const { studentId, from, to, granularity = 'day' } = dto;
    
    // 模拟数据生成
    const series = this.generateMockTrendData(from, to, granularity);
    
    return {
      studentId,
      series
    };
  }

  /**
   * 获取学生横向对比数据
   * 当前返回模拟数据，后续可接入真实数据库
   */
  async getStudentComparison(dto: ComparisonRequestDto): Promise<ComparisonResponse> {
    const { studentIds, metrics, window = 'last_14d', classId } = dto;
    
    // 生成模拟对比数据
    const items = this.generateMockComparisonData(studentIds, metrics);
    const class_percentiles = this.generateMockPercentiles(metrics);
    
    return {
      window,
      items,
      class_percentiles
    };
  }

  /**
   * 生成模拟趋势数据
   */
  private generateMockTrendData(from?: string, to?: string, granularity: 'day' | 'week' = 'day'): TrendDataPoint[] {
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 默认30天前
    const endDate = to ? new Date(to) : new Date();
    
    const series: TrendDataPoint[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // 模拟学习数据
      const timeSpent = Math.floor(Math.random() * 60) + 10; // 10-70分钟
      const tasksDone = Math.floor(Math.random() * 10) + 1; // 1-10个任务
      const accuracy = Math.random() * 0.4 + 0.6; // 60%-100%准确率
      const xp = Math.floor(tasksDone * (accuracy * 10 + 5)); // 基于任务数和准确率的XP
      const streak = Math.floor(Math.random() * 15) + 1; // 1-15天连续学习
      
      series.push({
        date: currentDate.toISOString().split('T')[0],
        time_spent_min: timeSpent,
        tasks_done: tasksDone,
        accuracy: Math.round(accuracy * 100) / 100,
        xp,
        streak
      });
      
      // 根据粒度增加日期
      if (granularity === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }
    
    return series;
  }

  /**
   * 生成模拟对比数据
   */
  private generateMockComparisonData(studentIds: string[], metrics: string[]): ComparisonItem[] {
    return studentIds.map((studentId, index) => {
      const baseAccuracy = 0.7 + Math.random() * 0.25; // 70%-95%
      const baseTasks = Math.floor(Math.random() * 50) + 20; // 20-70个任务
      const baseTime = Math.floor(Math.random() * 300) + 100; // 100-400分钟
      const baseXp = Math.floor(baseTasks * (baseAccuracy * 10 + 5));
      const baseStreak = Math.floor(Math.random() * 20) + 1; // 1-20天
      
      return {
        studentId,
        accuracy: Math.round(baseAccuracy * 100) / 100,
        tasks_done: baseTasks,
        time_spent_min: baseTime,
        xp: baseXp,
        streak: baseStreak,
        rank: index + 1,
        isAnonymous: false
      };
    }).sort((a, b) => b.xp - a.xp); // 按XP排序
  }

  /**
   * 生成模拟班级分位数数据
   */
  private generateMockPercentiles(metrics: string[]): ClassPercentiles {
    const percentiles: ClassPercentiles = {
      p50: {},
      p90: {}
    };
    
    metrics.forEach(metric => {
      switch (metric) {
        case 'accuracy':
          percentiles.p50.accuracy = 0.75;
          percentiles.p90.accuracy = 0.90;
          break;
        case 'tasks_done':
          percentiles.p50.tasks_done = 35;
          percentiles.p90.tasks_done = 60;
          break;
        case 'time_spent_min':
          percentiles.p50.time_spent_min = 200;
          percentiles.p90.time_spent_min = 350;
          break;
        case 'xp':
          percentiles.p50.xp = 500;
          percentiles.p90.xp = 800;
          break;
        case 'streak':
          percentiles.p50.streak = 7;
          percentiles.p90.streak = 15;
          break;
      }
    });
    
    return percentiles;
  }
}
