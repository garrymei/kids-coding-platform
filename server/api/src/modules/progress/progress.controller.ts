import { Controller, Get, Post, Param, Body, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { HomeProgressDto, PackageProgressDto, ProgressEventDto } from './dto/progress.dto';
import { LoggerService } from '../../common/services/logger.service';

@Controller('progress')
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly logger: LoggerService
  ) {}

  /**
   * 获取学生首页进度数据
   * GET /progress/students/:id/home
   */
  @Get('students/:id/home')
  async getHomeProgress(
    @Param('id') studentId: string,
    @Request() req: any
  ): Promise<HomeProgressDto> {
    try {
      this.logger.info('Fetching home progress', {
        studentId,
        cid: this.generateCorrelationId(),
      });

      const result = await this.progressService.getHomeProgress(studentId);

      this.logger.info('Home progress fetched successfully', {
        studentId,
        xp: result.xp,
        streakDays: result.streakDays,
        todayAttempts: result.today.attempts,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch home progress', { error, studentId });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch home progress',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取课程包进度
   * GET /progress/students/:id/packages/:pkgId
   */
  @Get('students/:id/packages/:pkgId')
  async getPackageProgress(
    @Param('id') studentId: string,
    @Param('pkgId') pkgId: string,
    @Request() req: any
  ): Promise<PackageProgressDto> {
    try {
      this.logger.info('Fetching package progress', {
        studentId,
        pkgId,
        cid: this.generateCorrelationId(),
      });

      const result = await this.progressService.getPackageProgress(studentId, pkgId);

      this.logger.info('Package progress fetched successfully', {
        studentId,
        pkgId,
        completed: result.completed,
        total: result.total,
        percent: result.percent,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch package progress', { error, studentId, pkgId });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch package progress',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 记录学习事件
   * POST /progress/events
   */
  @Post('events')
  async recordProgressEvent(
    @Body() event: ProgressEventDto,
    @Request() req: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.info('Recording progress event', {
        studentId: event.studentId,
        levelId: event.levelId,
        passed: event.passed,
        cid: this.generateCorrelationId(),
      });

      await this.progressService.recordProgressEvent(event);

      this.logger.info('Progress event recorded successfully', {
        studentId: event.studentId,
        levelId: event.levelId,
        passed: event.passed,
      });

      return {
        success: true,
        message: 'Progress event recorded successfully',
      };
    } catch (error) {
      this.logger.error('Failed to record progress event', { error, event });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to record progress event',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取学生统计信息
   * GET /progress/students/:id/stats
   */
  @Get('students/:id/stats')
  async getStudentStats(
    @Param('id') studentId: string,
    @Request() req: any
  ): Promise<{
    totalXp: number;
    streakDays: number;
    completedLevels: number;
    totalStudyTime: number;
    achievements: number;
  }> {
    try {
      this.logger.info('Fetching student stats', {
        studentId,
        cid: this.generateCorrelationId(),
      });

      const homeProgress = await this.progressService.getHomeProgress(studentId);
      
      // 计算总学习时间（分钟）
      const totalStudyTime = homeProgress.today.studyMinutes; // 简化计算

      const stats = {
        totalXp: homeProgress.xp,
        streakDays: homeProgress.streakDays,
        completedLevels: homeProgress.packages.reduce((sum, pkg) => sum + pkg.completed, 0),
        totalStudyTime,
        achievements: homeProgress.achievements.length,
      };

      this.logger.info('Student stats fetched successfully', {
        studentId,
        stats,
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch student stats', { error, studentId });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch student stats',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
