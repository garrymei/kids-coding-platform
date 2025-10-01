import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';

// Simple in-memory cache for metrics
interface CacheItem<T> {
  data: T;
  expiry: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export interface TrendPoint {
  t: string; // ISO date string
  v: number; // value
}

export interface TrendSeries {
  dim: string; // dimension name
  points: TrendPoint[];
}

export interface TrendResponse {
  series: TrendSeries[];
}

export interface ComparisonRow {
  studentId: string;
  name: string;
  [key: string]: any; // dynamic metrics
}

export interface ComparisonResponse {
  rows: ComparisonRow[];
}

@Injectable()
export class RealMetricsService {
  private readonly logger = new Logger(RealMetricsService.name);
  private readonly trendCache = new SimpleCache<TrendResponse>();
  private readonly comparisonCache = new SimpleCache<ComparisonResponse>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  // 获取学生趋势数据
  async getStudentTrend(
    studentId: string,
    dims: string[],
    period: 'daily' | 'weekly',
    from: string,
    to: string,
  ): Promise<TrendResponse> {
    this.logger.log(`Getting trend for student ${studentId}, dims: ${dims.join(',')}, period: ${period}`);
    
    const cacheKey = `trend:${studentId}:${dims.join(',')}:${period}:${from}-${to}`;
    
    // Try Redis cache first
    const cached = await this.cacheService.get<TrendResponse>(cacheKey);
    if (cached) {
      this.logger.log(`Redis cache hit for trend: ${cacheKey}`);
      await this.cacheService.recordCacheHit('trend');
      return cached;
    }
    
    // Fallback to in-memory cache
    const memoryCached = this.trendCache.get(cacheKey);
    if (memoryCached) {
      this.logger.log(`Memory cache hit for trend: ${cacheKey}`);
      return memoryCached;
    }
    
    await this.cacheService.recordCacheMiss('trend');

    try {
      // Verify student exists
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
      });

      if (!student || student.role !== 'student') {
        throw new NotFoundException('Student not found');
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);

      const series: TrendSeries[] = [];

      for (const dim of dims) {
        const points = await this.getTrendPoints(studentId, dim, period, fromDate, toDate);
        series.push({
          dim,
          points,
        });
      }

      const result: TrendResponse = { series };
      
      // Cache in both Redis and memory
      await this.cacheService.set(cacheKey, result, 300); // 5 minutes
      this.trendCache.set(cacheKey, result, 5 * 60 * 1000);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to get student trend:', error);
      throw error;
    }
  }

  private async getTrendPoints(
    studentId: string,
    dim: string,
    period: 'daily' | 'weekly',
    fromDate: Date,
    toDate: Date,
  ): Promise<TrendPoint[]> {
    const points: TrendPoint[] = [];

    if (period === 'daily') {
      // Get daily stats
      const dailyStats = await this.prisma.dailyStat.findMany({
        where: {
          studentId,
          date: {
            gte: fromDate,
            lte: toDate,
          },
        },
        orderBy: { date: 'asc' },
      });

      // Fill gaps with zero values
      const currentDate = new Date(fromDate);
      const endDate = new Date(toDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const stat = dailyStats.find(s => s.date.toISOString().split('T')[0] === dateStr);
        
        let value = 0;
        if (stat) {
          switch (dim) {
            case 'study_minutes':
              value = stat.studyMinutes;
              break;
            case 'levels_completed':
              value = stat.levelsCompleted;
              break;
            case 'retry_count':
              value = stat.attempts - stat.passes;
              break;
            case 'accuracy':
              value = stat.attempts > 0 ? (stat.passes / stat.attempts) * 100 : 0;
              break;
            default:
              value = 0;
          }
        }

        points.push({
          t: dateStr,
          v: Math.round(value * 100) / 100, // Round to 2 decimal places
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Weekly aggregation
      const weeklyData = await this.prisma.$queryRaw<Array<{
        week_start: Date;
        study_minutes: number;
        attempts: number;
        passes: number;
        levels_completed: number;
      }>>`
        SELECT 
          DATE_TRUNC('week', date) as week_start,
          SUM(study_minutes) as study_minutes,
          SUM(attempts) as attempts,
          SUM(passes) as passes,
          SUM(levels_completed) as levels_completed
        FROM "DailyStat"
        WHERE student_id = ${studentId}
          AND date >= ${fromDate}
          AND date <= ${toDate}
        GROUP BY DATE_TRUNC('week', date)
        ORDER BY week_start
      `;

      for (const week of weeklyData) {
        let value = 0;
        switch (dim) {
          case 'study_minutes':
            value = Number(week.study_minutes) || 0;
            break;
          case 'levels_completed':
            value = Number(week.levels_completed) || 0;
            break;
          case 'retry_count':
            value = (Number(week.attempts) || 0) - (Number(week.passes) || 0);
            break;
          case 'accuracy':
            const attempts = Number(week.attempts) || 0;
            const passes = Number(week.passes) || 0;
            value = attempts > 0 ? (passes / attempts) * 100 : 0;
            break;
          default:
            value = 0;
        }

        points.push({
          t: week.week_start.toISOString().split('T')[0],
          v: Math.round(value * 100) / 100,
        });
      }
    }

    return points;
  }

  // 获取班级对比数据
  async getClassComparison(
    classId: string,
    dims: string[],
    period: 'weekly',
    week: string, // YYYY-MM-DD (Monday)
  ): Promise<ComparisonResponse> {
    this.logger.log(`Getting class comparison for class ${classId}, dims: ${dims.join(',')}, week: ${week}`);
    
    const cacheKey = `compare:${classId}:${week}:${dims.join(',')}`;
    
    // Try Redis cache first
    const cached = await this.cacheService.get<ComparisonResponse>(cacheKey);
    if (cached) {
      this.logger.log(`Redis cache hit for comparison: ${cacheKey}`);
      await this.cacheService.recordCacheHit('comparison');
      return cached;
    }
    
    // Fallback to in-memory cache
    const memoryCached = this.comparisonCache.get(cacheKey);
    if (memoryCached) {
      this.logger.log(`Memory cache hit for comparison: ${cacheKey}`);
      return memoryCached;
    }
    
    await this.cacheService.recordCacheMiss('comparison');

    try {
      // Get class members
      const classMembers = await this.prisma.classEnrollment.findMany({
        where: {
          classId,
          status: 'ACTIVE',
        },
        include: {
          student: {
            select: {
              id: true,
              displayName: true,
              nickname: true,
              email: true,
            },
          },
        },
      });

      const weekStart = new Date(week);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const rows: ComparisonRow[] = [];

      for (const member of classMembers) {
        const studentId = member.studentId;
        const studentName = member.student.displayName || member.student.nickname || member.student.email;

        // Get weekly stats for this student
        const weeklyStats = await this.prisma.$queryRaw<Array<{
          study_minutes: number;
          attempts: number;
          passes: number;
          levels_completed: number;
        }>>`
          SELECT 
            SUM(study_minutes) as study_minutes,
            SUM(attempts) as attempts,
            SUM(passes) as passes,
            SUM(levels_completed) as levels_completed
          FROM "DailyStat"
          WHERE student_id = ${studentId}
            AND date >= ${weekStart}
            AND date <= ${weekEnd}
        `;

        const stats = weeklyStats[0] || {
          study_minutes: 0,
          attempts: 0,
          passes: 0,
          levels_completed: 0,
        };

        const row: ComparisonRow = {
          studentId,
          name: studentName,
        };

        // Add requested dimensions
        for (const dim of dims) {
          switch (dim) {
            case 'levels_completed':
              row[dim] = Number(stats.levels_completed) || 0;
              break;
            case 'retry_count':
              row[dim] = (Number(stats.attempts) || 0) - (Number(stats.passes) || 0);
              break;
            case 'accuracy':
              const attempts = Number(stats.attempts) || 0;
              const passes = Number(stats.passes) || 0;
              row[dim] = attempts > 0 ? Math.round((passes / attempts) * 100 * 100) / 100 : 0;
              break;
            case 'study_minutes':
              row[dim] = Number(stats.study_minutes) || 0;
              break;
            default:
              row[dim] = 0;
          }
        }

        rows.push(row);
      }

      const result: ComparisonResponse = { rows };
      
      // Cache in both Redis and memory
      await this.cacheService.set(cacheKey, result, 300); // 5 minutes
      this.comparisonCache.set(cacheKey, result, 5 * 60 * 1000);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to get class comparison:', error);
      throw error;
    }
  }

  // 记录学习事件
  async recordLearnEvent(
    studentId: string,
    levelId: string,
    passed: boolean,
    timeMs?: number,
  ): Promise<void> {
    this.logger.log(`Recording learn event for student ${studentId}, level ${levelId}, passed: ${passed}`);

    try {
      // Create learn event
      await this.prisma.learnEvent.create({
        data: {
          studentId,
          levelId,
          passed,
          timeMs,
          ts: new Date(),
        },
      });

      // Update daily stats
      await this.updateDailyStats(studentId, passed, timeMs);

      // Invalidate relevant caches
      await this.invalidateStudentCaches(studentId);

      this.logger.log(`Successfully recorded learn event for student ${studentId}`);
    } catch (error) {
      this.logger.error('Failed to record learn event:', error);
      throw error;
    }
  }

  private async updateDailyStats(studentId: string, passed: boolean, timeMs?: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    // Upsert daily stat
    await this.prisma.dailyStat.upsert({
      where: {
        studentId_date: {
          studentId,
          date: today,
        },
      },
      update: {
        attempts: { increment: 1 },
        passes: { increment: passed ? 1 : 0 },
        studyMinutes: { increment: timeMs ? Math.round(timeMs / 60000) : 0 }, // Convert ms to minutes
        levelsCompleted: passed ? { increment: 1 } : undefined, // Only increment on first pass
      },
      create: {
        studentId,
        date: today,
        attempts: 1,
        passes: passed ? 1 : 0,
        studyMinutes: timeMs ? Math.round(timeMs / 60000) : 0,
        levelsCompleted: passed ? 1 : 0,
      },
    });
  }

  private async invalidateStudentCaches(studentId: string): Promise<void> {
    // Clear Redis caches
    await this.cacheService.invalidateStudentCaches(studentId);
    
    // Clear in-memory trend caches for this student
    const trendKeys = Array.from(this.trendCache['cache'].keys()).filter(key => 
      key.startsWith(`trend:${studentId}:`)
    );
    trendKeys.forEach(key => this.trendCache.delete(key));

    // Clear in-memory comparison caches (since they might include this student)
    this.comparisonCache.clear();

    this.logger.log(`Invalidated caches for student ${studentId}`);
  }
}
