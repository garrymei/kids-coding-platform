/**
 * 关卡扫描器
 * 用于动态发现和加载所有关卡文件
 */

interface LevelFile {
  id: string;
  path: string;
  gameType: string;
  category: string;
  fullPath: string;
}

export class LevelScanner {
  private static readonly GAME_TYPES = ['pixel', 'led', 'turtle', 'io'];
  private static readonly CATEGORIES = ['beginner', 'intermediate', 'advanced', 'challenge'];
  
  /**
   * 扫描指定目录下的所有关卡文件
   */
  static async scanLevelsInDirectory(gameType: string, category: string): Promise<LevelFile[]> {
    const levels: LevelFile[] = [];
    const basePath = `/levels/python/${gameType}/${category}`;
    
    try {
      // 尝试加载已知的关卡文件
      const knownLevels = this.getKnownLevels(gameType, category);
      
      for (const levelId of knownLevels) {
        const fullPath = `${basePath}/${levelId}.json`;
        
        try {
          // 验证文件是否存在
          const response = await fetch(fullPath);
          if (response.ok) {
            levels.push({
              id: levelId,
              path: fullPath,
              gameType,
              category,
              fullPath
            });
          }
        } catch (error) {
          console.warn(`Failed to load level ${levelId}:`, error);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan ${gameType}/${category}:`, error);
    }
    
    return levels;
  }

  /**
   * 获取已知的关卡列表
   * 这里硬编码了一些已知的关卡，实际项目中可以通过文件系统API动态获取
   */
  private static getKnownLevels(gameType: string, category: string): string[] {
    const levelMap: Record<string, Record<string, string[]>> = {
      pixel: {
        beginner: ['pixel-001', 'pixel-002', 'pixel-003', 'pixel-004', 'pixel-005'],
        intermediate: ['pixel-011', 'pixel-012', 'pixel-013', 'pixel-014', 'pixel-015'],
        advanced: ['pixel-021', 'pixel-022', 'pixel-023', 'pixel-024', 'pixel-025'],
        challenge: ['pixel-031', 'pixel-032', 'pixel-033', 'pixel-034', 'pixel-035']
      },
      led: {
        beginner: ['led-001', 'led-002', 'led-003', 'led-004', 'led-005'],
        intermediate: ['led-011', 'led-012', 'led-013', 'led-014', 'led-015'],
        advanced: ['led-021', 'led-022', 'led-023', 'led-024', 'led-025'],
        challenge: ['led-031', 'led-032', 'led-033', 'led-034', 'led-035']
      },
      turtle: {
        beginner: ['turtle-001', 'turtle-002', 'turtle-003', 'turtle-004', 'turtle-005'],
        intermediate: ['turtle-011', 'turtle-012', 'turtle-013', 'turtle-014', 'turtle-015'],
        advanced: ['turtle-021', 'turtle-022', 'turtle-023', 'turtle-024', 'turtle-025'],
        challenge: ['turtle-031', 'turtle-032', 'turtle-033', 'turtle-034', 'turtle-035']
      },
      io: {
        beginner: ['io-001', 'io-002', 'io-003', 'io-004', 'io-005'],
        intermediate: ['io-011', 'io-012', 'io-013', 'io-014', 'io-015'],
        advanced: ['io-021', 'io-022', 'io-023', 'io-024', 'io-025'],
        challenge: ['io-031', 'io-032', 'io-033', 'io-034', 'io-035']
      }
    };

    return levelMap[gameType]?.[category] || [];
  }

  /**
   * 扫描所有关卡文件
   */
  static async scanAllLevels(): Promise<LevelFile[]> {
    const allLevels: LevelFile[] = [];
    
    for (const gameType of this.GAME_TYPES) {
      for (const category of this.CATEGORIES) {
        const levels = await this.scanLevelsInDirectory(gameType, category);
        allLevels.push(...levels);
      }
    }
    
    return allLevels;
  }

  /**
   * 按游戏类型分组关卡
   */
  static groupLevelsByGameType(levels: LevelFile[]): Record<string, LevelFile[]> {
    return levels.reduce((groups, level) => {
      if (!groups[level.gameType]) {
        groups[level.gameType] = [];
      }
      groups[level.gameType].push(level);
      return groups;
    }, {} as Record<string, LevelFile[]>);
  }

  /**
   * 按难度分组关卡
   */
  static groupLevelsByCategory(levels: LevelFile[]): Record<string, LevelFile[]> {
    return levels.reduce((groups, level) => {
      if (!groups[level.category]) {
        groups[level.category] = [];
      }
      groups[level.category].push(level);
      return groups;
    }, {} as Record<string, LevelFile[]>);
  }
}