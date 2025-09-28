import { Controller, Get, Param, Query, HttpException, HttpStatus, Request } from '@nestjs/common';
import { LevelService } from './level.service';
import { LevelListQueryDto, LevelListResponseDto, LevelDetailDto } from './dto/level.dto';
import { LoggerService } from '../../common/services/logger.service';

@Controller('levels')
export class LevelController {
  constructor(
    private readonly levelService: LevelService,
    private readonly logger: LoggerService
  ) {}

  /**
   * 获取关卡列表
   * GET /levels?chapter=W1&page=1&pageSize=20&lang=python
   */
  @Get()
  async getLevels(
    @Query() query: LevelListQueryDto,
    @Request() req: any
  ): Promise<LevelListResponseDto> {
    try {
      // 从请求中获取学生ID（实际项目中应该从认证信息中获取）
      const studentId = req.user?.id || req.headers['x-student-id'] || 'stu_1';

      this.logger.info('Fetching levels list', {
        query,
        studentId,
        cid: this.generateCorrelationId(),
      });

      const result = await this.levelService.getLevels(query, studentId);

      this.logger.info('Levels list fetched successfully', {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.hasMore,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch levels list', { error, query });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch levels list',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取关卡详情
   * GET /levels/:id
   */
  @Get(':id')
  async getLevelById(
    @Param('id') levelId: string,
    @Request() req: any
  ): Promise<LevelDetailDto> {
    try {
      // 从请求中获取学生ID
      const studentId = req.user?.id || req.headers['x-student-id'] || 'stu_1';

      this.logger.info('Fetching level details', {
        levelId,
        studentId,
        cid: this.generateCorrelationId(),
      });

      const result = await this.levelService.getLevelById(levelId, studentId);

      this.logger.info('Level details fetched successfully', {
        levelId,
        unlocked: !!result.expected,
        hasAssets: !!result.assets,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch level details', { error, levelId });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch level details',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取关卡统计信息
   * GET /levels/stats
   */
  @Get('stats')
  async getLevelStats() {
    try {
      this.logger.info('Fetching level statistics');

      const stats = await this.levelService.getLevelStats();

      this.logger.info('Level statistics fetched successfully', { stats });

      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch level statistics', { error });

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch level statistics',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 重新加载关卡数据（开发环境用）
   * POST /levels/reload
   */
  @Get('reload')
  async reloadLevels() {
    try {
      this.logger.info('Reloading levels data');

      await this.levelService.reloadLevels();

      this.logger.info('Levels data reloaded successfully');

      return {
        message: 'Levels data reloaded successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to reload levels data', { error });

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reload levels data',
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
