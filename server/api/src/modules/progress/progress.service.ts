import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { HomeProgressDto, PackageProgressDto, ProgressEventDto } from './dto/progress.dto';

interface DailyStat {
  date: string; // YYYY-MM-DD
  studyMinutes: number;
  attempts: number;
  passes: number;
  xp: number;
}

interface StudentProgress {
  studentId: string;
  xp: number;
  streakDays: number;
  dailyStats: DailyStat[];
  completedLevels: string[];
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
    icon: string;
  }>;
  lastActivity: string;
}

@Injectable()
export class ProgressService {
  private progressCache: Map<string, StudentProgress> = new Map();
  private packageCache: Map<string, PackageProgressDto> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 30 * 1000; // 30秒缓存

  constructor(private readonly logger: LoggerService) {
    this.initializeMockData();
  }

  /**
   * 初始化模拟数据
   */
  private initializeMockData(): void {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 模拟学生进度数据
    const mockProgress: StudentProgress = {
      studentId: 'stu_1',
      xp: 150,
      streakDays: 5,
      dailyStats: [
        {
          date: today,
          studyMinutes: 25,
          attempts: 8,
          passes: 6,
          xp: 30,
        },
        {
          date: yesterday,
          studyMinutes: 35,
          attempts: 10,
          passes: 8,
          xp: 40,
        },
      ],
      completedLevels: ['py-w1-l1', 'py-w1-l2', 'py-w1-l3'],
      achievements: [
        {
          id: 'first_steps',
          name: '启航者',
          description: '完成第一个关卡',
          unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          icon: '🚀',
        },
        {
          id: 'streak_5',
          name: '坚持达人',
          description: '连续学习5天',
          unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          icon: '🔥',
        },
      ],
      lastActivity: new Date().toISOString(),
    };

    this.progressCache.set('stu_1', mockProgress);

    // 模拟课程包进度
    const mockPackageProgress: PackageProgressDto = {
      pkgId: 'python-basics',
      levels: [
        { levelId: 'py-w1-l1', status: 'done' },
        { levelId: 'py-w1-l2', status: 'done' },
        { levelId: 'py-w1-l3', status: 'done' },
        { levelId: 'py-w1-l4', status: 'in_progress' },
        { levelId: 'py-w1-l5', status: 'locked' },
        { levelId: 'py-w1-l6', status: 'locked' },
      ],
      completed: 3,
      total: 6,
      percent: 0.5,
      ts: Date.now(),
    };

    this.packageCache.set('stu_1_python-basics', mockPackageProgress);
  }

  /**
   * 获取学生首页进度数据
   */
  async getHomeProgress(studentId: string): Promise<HomeProgressDto> {
    this.checkCache();

    const studentProgress = this.progressCache.get(studentId);
    if (!studentProgress) {
      throw new NotFoundException({
        code: 'STUDENT_NOT_FOUND',
        message: `Student with id '${studentId}' not found`,
        cid: this.generateCorrelationId(),
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const todayStats = studentProgress.dailyStats.find(stat => stat.date === today) || {
      date: today,
      studyMinutes: 0,
      attempts: 0,
      passes: 0,
      xp: 0,
    };

    // 获取课程包进度
    const packages = await this.getPackageProgresses(studentId);

    // 获取下一个推荐课程
    const nextLesson = this.getNextLesson(studentProgress);

    // 获取最近活动
    const recent = this.getRecentActivities(studentProgress);

    const homeProgress: HomeProgressDto = {
      xp: studentProgress.xp,
      streakDays: studentProgress.streakDays,
      today: {
        studyMinutes: todayStats.studyMinutes,
        attempts: todayStats.attempts,
        passes: todayStats.passes,
      },
      packages,
      nextLesson,
      recent,
      achievements: studentProgress.achievements,
    };

    this.logger.info('Home progress fetched', {
      studentId,
      xp: homeProgress.xp,
      streakDays: homeProgress.streakDays,
      todayAttempts: homeProgress.today.attempts,
    });

    return homeProgress;
  }

  /**
   * 获取课程包进度
   */
  async getPackageProgress(studentId: string, pkgId: string): Promise<PackageProgressDto> {
    this.checkCache();

    const cacheKey = `${studentId}_${pkgId}`;
    const cached = this.packageCache.get(cacheKey);
    
    if (cached && Date.now() - (cached.ts || 0) < this.CACHE_TTL) {
      return cached;
    }

    // 模拟从数据库获取数据
    const packageProgress: PackageProgressDto = {
      pkgId,
      levels: [
        { levelId: 'py-w1-l1', status: 'done' },
        { levelId: 'py-w1-l2', status: 'done' },
        { levelId: 'py-w1-l3', status: 'done' },
        { levelId: 'py-w1-l4', status: 'in_progress' },
        { levelId: 'py-w1-l5', status: 'locked' },
        { levelId: 'py-w1-l6', status: 'locked' },
      ],
      completed: 3,
      total: 6,
      percent: 0.5,
      ts: Date.now(),
    };

    this.packageCache.set(cacheKey, packageProgress);

    return packageProgress;
  }

  /**
   * 记录学习事件
   */
  async recordProgressEvent(event: ProgressEventDto): Promise<void> {
    const studentProgress = this.progressCache.get(event.studentId);
    if (!studentProgress) {
      this.logger.error('Student not found for progress event', { event });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    let todayStats = studentProgress.dailyStats.find(stat => stat.date === today);

    if (!todayStats) {
      todayStats = {
        date: today,
        studyMinutes: 0,
        attempts: 0,
        passes: 0,
        xp: 0,
      };
      studentProgress.dailyStats.push(todayStats);
    }

    // 更新今日统计
    todayStats.attempts += 1;
    if (event.passed) {
      todayStats.passes += 1;
      todayStats.xp += 20; // 通关奖励XP
      studentProgress.xp += 20;

      // 添加到已完成关卡
      if (!studentProgress.completedLevels.includes(event.levelId)) {
        studentProgress.completedLevels.push(event.levelId);
      }
    }

    // 更新学习时间
    if (event.timeSpentMs) {
      todayStats.studyMinutes += Math.round(event.timeSpentMs / 60000);
    }

    // 更新最后活动时间
    studentProgress.lastActivity = new Date().toISOString();

    // 更新连续学习天数
    this.updateStreakDays(studentProgress);

    // 失效相关缓存
    this.invalidateCache(event.studentId);

    this.logger.info('Progress event recorded', {
      studentId: event.studentId,
      levelId: event.levelId,
      passed: event.passed,
      newXp: studentProgress.xp,
      streakDays: studentProgress.streakDays,
    });
  }

  /**
   * 获取课程包进度列表
   */
  private async getPackageProgresses(studentId: string): Promise<Array<{
    pkgId: string;
    title: string;
    completed: number;
    total: number;
    percent: number;
  }>> {
    const packages = [
      { pkgId: 'python-basics', title: 'Python基础' },
      { pkgId: 'python-loops', title: '循环与条件' },
      { pkgId: 'python-functions', title: '函数与模块' },
    ];

    const results = [];
    for (const pkg of packages) {
      const progress = await this.getPackageProgress(studentId, pkg.pkgId);
      results.push({
        pkgId: pkg.pkgId,
        title: pkg.title,
        completed: progress.completed,
        total: progress.total,
        percent: progress.percent,
      });
    }

    return results;
  }

  /**
   * 获取下一个推荐课程
   */
  private getNextLesson(studentProgress: StudentProgress): {
    levelId: string;
    title: string;
    chapter: string;
  } | undefined {
    // 简单的推荐逻辑：找到第一个未完成的关卡
    const allLevels = [
      { levelId: 'py-w1-l1', title: '你好，实验岛！', chapter: 'W1' },
      { levelId: 'py-w1-l2', title: '变量与计算', chapter: 'W1' },
      { levelId: 'py-w1-l3', title: '条件判断', chapter: 'W1' },
      { levelId: 'py-w1-l4', title: '循环基础', chapter: 'W1' },
    ];

    for (const level of allLevels) {
      if (!studentProgress.completedLevels.includes(level.levelId)) {
        return level;
      }
    }

    return undefined;
  }

  /**
   * 获取最近活动
   */
  private getRecentActivities(studentProgress: StudentProgress): Array<{
    levelId: string;
    title: string;
    passed: boolean;
    timestamp: string;
  }> {
    // 模拟最近活动数据
    return [
      {
        levelId: 'py-w1-l3',
        title: '条件判断',
        passed: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        levelId: 'py-w1-l2',
        title: '变量与计算',
        passed: true,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        levelId: 'py-w1-l1',
        title: '你好，实验岛！',
        passed: true,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  /**
   * 更新连续学习天数
   */
  private updateStreakDays(studentProgress: StudentProgress): void {
    const today = new Date().toISOString().split('T')[0];
    const sortedStats = studentProgress.dailyStats
      .sort((a, b) => b.date.localeCompare(a.date));

    let streakDays = 0;
    let currentDate = new Date(today);

    for (const stat of sortedStats) {
      const statDate = new Date(stat.date);
      const daysDiff = Math.floor((currentDate.getTime() - statDate.getTime()) / (24 * 60 * 60 * 1000));

      if (daysDiff === streakDays && stat.studyMinutes > 0) {
        streakDays++;
        currentDate = new Date(statDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    studentProgress.streakDays = streakDays;
  }

  /**
   * 检查缓存是否需要刷新
   */
  private checkCache(): void {
    if (Date.now() - this.cacheTimestamp > this.CACHE_TTL) {
      this.cacheTimestamp = Date.now();
    }
  }

  /**
   * 失效缓存
   */
  private invalidateCache(studentId: string): void {
    // 失效首页缓存
    this.cacheTimestamp = 0;
    
    // 失效课程包缓存
    for (const [key] of this.packageCache) {
      if (key.startsWith(studentId)) {
        this.packageCache.delete(key);
      }
    }
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
