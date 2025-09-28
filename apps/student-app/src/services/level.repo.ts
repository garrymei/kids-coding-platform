import type { GamePack, Level, LevelManifest, LevelDetail } from '@kids/types';

class LevelRepository {
  private manifest: LevelManifest | null = null;
  private levelCache = new Map<string, LevelDetail>();

  /**
   * 加载关卡清单
   */
  async loadManifest(): Promise<LevelManifest> {
    if (this.manifest) {
      return this.manifest;
    }

    const response = await fetch('/levels/manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.statusText}`);
    }

    this.manifest = (await response.json()) as LevelManifest;
    return this.manifest;
  }

  /**
   * 获取指定语言的所有游戏包
   */
  async getPacks(lang: string): Promise<GamePack[]> {
    const manifest = await this.loadManifest();
    return manifest.packs.filter((pack) => pack.lang === lang);
  }

  /**
   * 获取指定语言和游戏类型的所有关卡
   */
  async getLevels(lang: string, gameType: string, tier?: string): Promise<Level[]> {
    const manifest = await this.loadManifest();
    let levels = manifest.levels.filter(
      (level) => level.lang === lang && level.gameType === gameType,
    );

    // 如果指定了难度等级，进一步过滤
    if (tier) {
      const tierMap: Record<string, number> = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
        challenge: 4,
        expert: 5,
      };

      const difficulty = tierMap[tier];
      if (difficulty) {
        levels = levels.filter((level) => level.difficulty === difficulty);
      }
    }

    return levels;
  }

  /**
   * 根据 ID 获取关卡详情
   */
  async getLevelById(id: string): Promise<LevelDetail | null> {
    // 先检查缓存
    if (this.levelCache.has(id)) {
      return this.levelCache.get(id)!;
    }

    try {
      // 从 manifest 中找到关卡路径
      const manifest = await this.loadManifest();
      const level = manifest.levels.find((l) => l.id === id);

      if (!level) {
        return null;
      }

      // 加载完整的关卡数据
      const response = await fetch(`/levels/${level.path}`);
      if (!response.ok) {
        throw new Error(`Failed to load level ${id}: ${response.statusText}`);
      }

      const levelDetail: LevelDetail = await response.json();

      // 缓存结果
      this.levelCache.set(id, levelDetail);

      return levelDetail;
    } catch (_error) {
      // console.error(`Failed to load level ${id}:`, _error);
      return null;
    }
  }

  /**
   * 获取下一个未完成的关卡
   */
  async getNextLevel(
    lang: string,
    gameType: string,
    completedLevels: string[],
  ): Promise<Level | null> {
    const levels = await this.getLevels(lang, gameType);

    // 按难度排序
    const sortedLevels = levels.sort((a, b) => a.difficulty - b.difficulty);

    // 找到第一个未完成的关卡
    return sortedLevels.find((level) => !completedLevels.includes(level.id)) || null;
  }

  /**
   * 获取游戏包的进度信息
   */
  async getPackProgress(
    lang: string,
    gameType: string,
    completedLevels: string[],
  ): Promise<{
    total: number;
    completed: number;
    progress: number;
  }> {
    const levels = await this.getLevels(lang, gameType);
    const completed = levels.filter((level) => completedLevels.includes(level.id)).length;

    return {
      total: levels.length,
      completed,
      progress: levels.length > 0 ? (completed / levels.length) * 100 : 0,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.manifest = null;
    this.levelCache.clear();
  }
}

// 导出单例实例
export const levelRepo = new LevelRepository();
