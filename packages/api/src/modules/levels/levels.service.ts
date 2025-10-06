import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

export interface Level {
  id: string;
  title: string;
  type: 'pixel' | 'music' | 'animation' | 'game';
  description?: string;
  difficulty: number;
  starter: {
    code: string;
    hints?: string[];
  };
  judge: {
    strategy: string;
    expected: any;
    timeout?: number;
  };
  metadata?: {
    tags?: string[];
    estimatedTime?: number;
    prerequisites?: string[];
  };
}

@Injectable()
export class LevelsService {
  private readonly logger = new Logger(LevelsService.name);
  private levelsCache: Map<string, Level> = new Map();
  private levelsList: Level[] = [];
  private isLoaded = false;

  constructor() {
    this.loadLevels().catch((error) => {
      this.logger.error('Failed to load levels on startup', error);
    });
  }

  async getAllLevels(): Promise<Level[]> {
    if (!this.isLoaded) {
      await this.loadLevels();
    }
    return [...this.levelsList];
  }

  async getLevelById(id: string): Promise<Level> {
    if (!this.isLoaded) {
      await this.loadLevels();
    }

    const level = this.levelsCache.get(id);
    if (!level) {
      throw new NotFoundException(`Level with id "${id}" not found`);
    }

    return level;
  }

  async getLevelsByType(type: string): Promise<Level[]> {
    if (!this.isLoaded) {
      await this.loadLevels();
    }

    return this.levelsList.filter((level) => level.type === type);
  }

  async searchLevels(query: string): Promise<Level[]> {
    if (!this.isLoaded) {
      await this.loadLevels();
    }

    const lowerQuery = query.toLowerCase();
    return this.levelsList.filter(
      (level) =>
        level.title.toLowerCase().includes(lowerQuery) ||
        level.description?.toLowerCase().includes(lowerQuery) ||
        level.id.toLowerCase().includes(lowerQuery),
    );
  }

  private async loadLevels(): Promise<void> {
    try {
      this.logger.log('Loading levels from docs/levels directory...');

      const levelsDir = join(process.cwd(), '..', '..', 'docs', 'levels');
      const files = await readdir(levelsDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      if (jsonFiles.length === 0) {
        this.logger.warn('No JSON level files found in docs/levels');
        return;
      }

      const allLevels: Level[] = [];
      const idSet = new Set<string>();

      for (const file of jsonFiles) {
        try {
          const filePath = join(levelsDir, file);
          const content = await readFile(filePath, 'utf8'); // 确保使用 UTF-8 编码
          const levels = JSON.parse(content);

          // 支持单个对象和数组两种格式
          const levelsArray = Array.isArray(levels) ? levels : [levels];

          for (const level of levelsArray) {
            // 验证关卡数据
            if (!this.validateLevel(level)) {
              this.logger.warn(`Invalid level data in ${file}:`, level);
              continue;
            }

            // 检查 ID 重复
            if (idSet.has(level.id)) {
              this.logger.error(`Duplicate level ID: ${level.id} in ${file}`);
              continue;
            }

            idSet.add(level.id);
            allLevels.push(level);
            this.levelsCache.set(level.id, level);
          }

          this.logger.log(`Loaded ${levelsArray.length} levels from ${file}`);
        } catch (error) {
          this.logger.error(`Failed to load levels from ${file}:`, error);
        }
      }

      // 按难度排序
      this.levelsList = allLevels.sort((a, b) => a.difficulty - b.difficulty);
      this.isLoaded = true;

      this.logger.log(`Successfully loaded ${this.levelsList.length} levels`);
    } catch (error) {
      this.logger.error('Failed to load levels:', error);
      throw error;
    }
  }

  private validateLevel(level: any): level is Level {
    return (
      typeof level === 'object' &&
      typeof level.id === 'string' &&
      typeof level.title === 'string' &&
      // 支持更多类型
      (level.type === undefined ||
        (typeof level.type === 'string' &&
          ['pixel', 'music', 'animation', 'game', 'io'].includes(
            level.type,
          ))) &&
      (level.difficulty === undefined ||
        typeof level.difficulty === 'number') &&
      // 支持不同的 starter 格式
      (level.starter === undefined ||
        (typeof level.starter === 'object' &&
          (typeof level.starter.code === 'string' || level.starter.blockly))) &&
      // 支持不同的 judge 格式
      (level.judge === undefined ||
        level.grader === undefined ||
        (typeof level.judge === 'object' &&
          (typeof level.judge.strategy === 'string' || level.judge.mode)) ||
        (typeof level.grader === 'object' && level.grader.mode))
    );
  }

  async reloadLevels(): Promise<void> {
    this.levelsCache.clear();
    this.levelsList = [];
    this.isLoaded = false;
    await this.loadLevels();
  }
}
