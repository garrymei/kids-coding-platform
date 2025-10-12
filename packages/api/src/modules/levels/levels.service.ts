import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {
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
    // 优先从数据库加载；如果数据库为空则回退到 docs
    try {
      const rows = await (this.prisma as any).level.findMany();
      if (rows.length > 0) {
        const allLevels: Level[] = [];
        for (const row of rows) {
          const level = this.mapRowToLevel(row as any);
          if (this.validateLevel(level)) {
            allLevels.push(level);
            this.levelsCache.set(level.id, level);
          }
        }
        this.levelsList = allLevels.sort(
          (a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0),
        );
        this.isLoaded = true;
        this.logger.log(
          `Loaded ${this.levelsList.length} levels from database`,
        );
        return;
      }
      this.logger.warn('No levels found in database, falling back to docs');
      await this.loadLevelsFromDocs();
    } catch (error) {
      this.logger.error(
        'Failed to load levels from database, falling back to docs',
        error,
      );
      await this.loadLevelsFromDocs();
    }
  }

  private async loadLevelsFromDocs(): Promise<void> {
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
          const content = await readFile(filePath, 'utf8');
          const levels = JSON.parse(content);

          const levelsArray = Array.isArray(levels) ? levels : [levels];

          for (const level of levelsArray) {
            if (!this.validateLevel(level)) {
              this.logger.warn(`Invalid level data in ${file}:`, level);
              continue;
            }

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

      this.levelsList = allLevels.sort(
        (a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0),
      );
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

  private mapRowToLevel(row: any): Level {
    return {
      id: row.id,
      title: row.title,
      type: row.type ?? 'game',
      description: row.description ?? undefined,
      difficulty: row.difficulty ?? 0,
      starter: (row.starter as any) ?? { code: '' },
      judge: (row.judge as any) ?? { strategy: 'manual', expected: null },
      metadata: (row.metadata as any) ?? undefined,
    };
  }
}
