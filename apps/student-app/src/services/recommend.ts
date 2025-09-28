import { levelRepo, type GamePack, type Level } from './level.repo';
import { progressStore } from '../store/progress';

export interface Recommendation {
  nextLevel: Level | null;
  reason: string;
  recommendedPack: GamePack | null;
}

class RecommendationService {
  async getNextLevelForStudent(): Promise<Recommendation> {
    try {
      // 获取所有Python�?
      const packs = await levelRepo.getPacks('python');
      const progress = progressStore.getProgress();
      
      // 按解锁顺序排序包
      const sortedPacks = packs.sort((a, b) => a.unlock.minLevel - b.unlock.minLevel);
      
      // 查找第一个未完成的包
      for (const pack of sortedPacks) {
        // 检查前置条件是否满�?
        const prereqsMet = pack.unlock.requires.every(req => {
          // 解析前置条件格式: "python/io"
          const [, reqGameType] = req.split('/');
          // 查找该包的第一个关卡是否已完成
          const reqPackLevels = progress.completedLevels.filter(id => 
            id.startsWith(`py-${reqGameType}-`)
          );
          return reqPackLevels.length > 0;
        });
        
        if (!prereqsMet) {
          continue;
        }
        
        // 获取该包的所有关�?
        const levels = await levelRepo.getLevels('python', pack.gameType);
        
        // 查找第一个未完成的关�?
        const nextLevel = levels.find(level => 
          !progress.completedLevels.includes(level.id)
        );
        
        if (nextLevel) {
          return {
            nextLevel,
            reason: `推荐关卡�?{pack.name} - ${nextLevel.title}`,
            recommendedPack: pack
          };
        }
      }
      
      // 如果所有关卡都完成了，返回第一个包作为复习推荐
      const firstPack = sortedPacks.length > 0 ? sortedPacks[0] : null;
      const firstPackLevels = firstPack ? await levelRepo.getLevels('python', firstPack.gameType) : [];
      const firstLevel = firstPackLevels.length > 0 ? firstPackLevels[0] : null;
      
      return {
        nextLevel: firstLevel,
        reason: '恭喜！你已经完成了所有关卡，建议复习第一个包',
        recommendedPack: firstPack
      };
    } catch (error) {
      // console.error('Failed to get recommendation:', error);
      return {
        nextLevel: null,
        reason: '无法获取推荐关卡',
        recommendedPack: null
      };
    }
  }
  
  async getRecommendedPack(): Promise<GamePack | null> {
    try {
      const packs = await levelRepo.getPacks('python');
      const progress = progressStore.getProgress();
      
      // 按解锁顺序排序包
      const sortedPacks = packs.sort((a, b) => a.unlock.minLevel - b.unlock.minLevel);
      
      // 查找第一个有未完成关卡的�?
      for (const pack of sortedPacks) {
        // 检查前置条件是否满�?
        const prereqsMet = pack.unlock.requires.every(req => {
          const [, reqGameType] = req.split('/');
          const reqPackLevels = progress.completedLevels.filter(id => 
            id.startsWith(`py-${reqGameType}-`)
          );
          return reqPackLevels.length > 0;
        });
        
        if (!prereqsMet) {
          continue;
        }
        
        // 获取该包的所有关�?
        const levels = await levelRepo.getLevels('python', pack.gameType);
        
        // 检查是否有未完成的关卡
        const hasUnfinishedLevels = levels.some(level => 
          !progress.completedLevels.includes(level.id)
        );
        
        if (hasUnfinishedLevels) {
          return pack;
        }
      }
      
      // 如果所有包都完成了，返回第一个包
      return sortedPacks.length > 0 ? sortedPacks[0] : null;
    } catch (error) {
      // console.error('Failed to get recommended pack:', error);
      return null;
    }
  }
  
  async getProgressSummary(): Promise<{
    totalPacks: number;
    completedPacks: number;
    totalLevels: number;
    completedLevels: number;
    nextMilestone: string;
  }> {
    try {
      const packs = await levelRepo.getPacks('python');
      const progress = progressStore.getProgress();
      
      let totalLevels = 0;
      let completedLevels = 0;
      
      // 计算总关卡数和已完成关卡�?
      for (const pack of packs) {
        const levels = await levelRepo.getLevels('python', pack.gameType);
        totalLevels += levels.length;
        completedLevels += levels.filter(level => 
          progress.completedLevels.includes(level.id)
        ).length;
      }
      
      // 计算已完成的包数
      const completedPacks = packs.filter(pack => {
        const levels = progress.completedLevels.filter(id => 
          id.startsWith(`py-${pack.gameType}-`)
        );
        return levels.length > 0;
      }).length;
      
      // 计算下一个里程碑
      const recommendation = await this.getNextLevelForStudent();
      const nextMilestone = recommendation.reason;
      
      return {
        totalPacks: packs.length,
        completedPacks,
        totalLevels,
        completedLevels,
        nextMilestone
      };
    } catch (error) {
      // console.error('Failed to get progress summary:', error);
      return {
        totalPacks: 0,
        completedPacks: 0,
        totalLevels: 0,
        completedLevels: 0,
        nextMilestone: '无法计算进度'
      };
    }
  }
}

export const recommendationService = new RecommendationService();
