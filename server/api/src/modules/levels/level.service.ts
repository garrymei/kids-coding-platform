import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { LevelListQueryDto, LevelPreviewDto, LevelDetailDto, LevelListResponseDto } from './dto/level.dto';
import * as fs from 'fs';
import * as path from 'path';

interface LevelData {
  id: string;
  title: string;
  world: string;
  lessonIndex: number;
  lang: string;
  type: string;
  difficulty: number;
  goals: string[];
  starter: {
    blockly?: string;
    code: string;
  };
  assets: any;
  grader: any;
  rewards: {
    xp: number;
    coins: number;
    badges: string[];
  };
  hints: string[];
  examples: Array<{
    input: string;
    output: string;
    explain: string;
  }>;
}

@Injectable()
export class LevelService {
  private levelsCache: Map<string, LevelData> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  constructor(private readonly logger: LoggerService) {
    this.loadLevels();
  }

  /**
   * 加载关卡数据
   */
  private loadLevels(): void {
    try {
      const levelsDir = path.join(process.cwd(), 'docs', 'levels');
      const files = fs.readdirSync(levelsDir).filter(file => file.endsWith('.json'));

      this.levelsCache.clear();
      
      for (const file of files) {
        try {
          const filePath = path.join(levelsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const levelData: LevelData = JSON.parse(content);
          
          this.levelsCache.set(levelData.id, levelData);
        } catch (error) {
          this.logger.error('Failed to load level file', { file, error });
        }
      }

      this.cacheTimestamp = Date.now();
      this.logger.info('Levels loaded successfully', { 
        count: this.levelsCache.size,
        files: files.length 
      });
    } catch (error) {
      this.logger.error('Failed to load levels directory', { error });
    }
  }

  /**
   * 检查缓存是否需要刷新
   */
  private checkCache(): void {
    if (Date.now() - this.cacheTimestamp > this.CACHE_TTL) {
      this.loadLevels();
    }
  }

  /**
   * 获取关卡列表
   */
  async getLevels(query: LevelListQueryDto, studentId?: string): Promise<LevelListResponseDto> {
    this.checkCache();

    const { chapter, page = 1, pageSize = 20, lang } = query;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // 过滤关卡
    let filteredLevels = Array.from(this.levelsCache.values());

    if (chapter) {
      filteredLevels = filteredLevels.filter(level => level.world === chapter);
    }

    if (lang) {
      filteredLevels = filteredLevels.filter(level => level.lang === lang);
    }

    // 按世界和课程索引排序
    filteredLevels.sort((a, b) => {
      if (a.world !== b.world) {
        return a.world.localeCompare(b.world);
      }
      return a.lessonIndex - b.lessonIndex;
    });

    const total = filteredLevels.length;
    const paginatedLevels = filteredLevels.slice(startIndex, endIndex);

    // 转换为预览DTO
    const items: LevelPreviewDto[] = paginatedLevels.map(level => ({
      id: level.id,
      title: level.title,
      chapter: level.world,
      preview: level.goals[0] || level.title,
      unlocked: this.isLevelUnlocked(level.id, studentId),
      version: '1.0.0',
      difficulty: level.difficulty,
      gameType: level.type,
      rewards: level.rewards,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: endIndex < total,
    };
  }

  /**
   * 获取关卡详情
   */
  async getLevelById(levelId: string, studentId?: string): Promise<LevelDetailDto> {
    this.checkCache();

    const level = this.levelsCache.get(levelId);
    if (!level) {
      throw new NotFoundException({
        code: 'LEVEL_NOT_FOUND',
        message: `Level with id '${levelId}' not found`,
        cid: this.generateCorrelationId(),
      });
    }

    const isUnlocked = this.isLevelUnlocked(levelId, studentId);

    const levelDetail: LevelDetailDto = {
      id: level.id,
      title: level.title,
      chapter: level.world,
      description: level.goals.join('; '),
      starterCode: level.starter.code,
      judge: {
        strategy: level.grader.mode || level.type,
        args: level.grader,
      },
      rewards: level.rewards,
      prerequisites: this.getPrerequisites(level),
      next: this.getNextLevel(level),
      version: '1.0.0',
      difficulty: level.difficulty,
      gameType: level.type,
      goals: level.goals,
      hints: level.hints,
      examples: level.examples,
    };

    // 只有解锁的关卡才返回敏感信息
    if (isUnlocked) {
      levelDetail.expected = level.grader;
      levelDetail.assets = level.assets;
    }

    return levelDetail;
  }

  /**
   * 检查关卡是否已解锁
   */
  private isLevelUnlocked(levelId: string, studentId?: string): boolean {
    if (!studentId) {
      // 没有学生ID时，默认解锁第一个关卡
      return levelId === 'py-w1-l1';
    }

    // 这里应该查询学生的进度数据
    // 暂时使用简单的逻辑：按顺序解锁
    const level = this.levelsCache.get(levelId);
    if (!level) return false;

    // 简单的解锁逻辑：W1的关卡按顺序解锁
    if (level.world === 'W1') {
      const w1Levels = Array.from(this.levelsCache.values())
        .filter(l => l.world === 'W1')
        .sort((a, b) => a.lessonIndex - b.lessonIndex);
      
      const currentIndex = w1Levels.findIndex(l => l.id === levelId);
      return currentIndex <= 2; // 暂时解锁前3个关卡
    }

    return true; // 其他世界的关卡默认解锁
  }

  /**
   * 获取前置条件
   */
  private getPrerequisites(level: LevelData): string[] {
    // 这里应该根据实际的关卡依赖关系返回
    // 暂时返回空数组
    return [];
  }

  /**
   * 获取下一个关卡
   */
  private getNextLevel(level: LevelData): string | undefined {
    const sameWorldLevels = Array.from(this.levelsCache.values())
      .filter(l => l.world === level.world)
      .sort((a, b) => a.lessonIndex - b.lessonIndex);

    const currentIndex = sameWorldLevels.findIndex(l => l.id === level.id);
    const nextLevel = sameWorldLevels[currentIndex + 1];

    return nextLevel?.id;
  }

  /**
   * 重新加载关卡数据（用于开发环境热重载）
   */
  async reloadLevels(): Promise<void> {
    this.loadLevels();
    this.logger.info('Levels reloaded manually');
  }

  /**
   * 获取关卡统计信息
   */
  async getLevelStats(): Promise<{
    total: number;
    byWorld: Record<string, number>;
    byType: Record<string, number>;
    byDifficulty: Record<number, number>;
  }> {
    this.checkCache();

    const levels = Array.from(this.levelsCache.values());
    const stats = {
      total: levels.length,
      byWorld: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byDifficulty: {} as Record<number, number>,
    };

    for (const level of levels) {
      stats.byWorld[level.world] = (stats.byWorld[level.world] || 0) + 1;
      stats.byType[level.type] = (stats.byType[level.type] || 0) + 1;
      stats.byDifficulty[level.difficulty] = (stats.byDifficulty[level.difficulty] || 0) + 1;
    }

    return stats;
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
