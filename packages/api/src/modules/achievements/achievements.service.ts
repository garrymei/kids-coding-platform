import { Injectable } from '@nestjs/common';

type AchievementCategory = 'xp' | 'streak' | 'completion' | 'special';
type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  unlockCondition: (state: UserAchievementState) => boolean;
}

interface UserAchievementState {
  xp: number;
  level: number;
  badges: string[];
  petStage: number;
  unlocked: Record<string, string>; // achievementId => ISO string
  lastUpdated: string;
}

interface UpdatePayload {
  xpDelta: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1850, 2350];

const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-pass',
    title: '首胜达成',
    description: '成功通过第一关',
    icon: '🎉',
    category: 'completion',
    rarity: 'common',
    xpReward: 10,
    unlockCondition: (state) =>
      state.unlocked['first-pass'] !== undefined || state.xp >= 10,
  },
  {
    id: 'xp-100',
    title: '经验新秀',
    description: '累计获得 100 XP',
    icon: '⭐',
    category: 'xp',
    rarity: 'common',
    xpReward: 20,
    unlockCondition: (state) => state.xp >= 100,
  },
  {
    id: 'xp-500',
    title: '经验高手',
    description: '累计获得 500 XP',
    icon: '✨',
    category: 'xp',
    rarity: 'rare',
    xpReward: 40,
    unlockCondition: (state) => state.xp >= 500,
  },
  {
    id: 'level-3',
    title: '冒险启程',
    description: '达到等级 3',
    icon: '🚀',
    category: 'completion',
    rarity: 'rare',
    xpReward: 30,
    unlockCondition: (state) => state.level >= 3,
  },
  {
    id: 'level-5',
    title: '成长先锋',
    description: '达到等级 5',
    icon: '🏆',
    category: 'special',
    rarity: 'epic',
    xpReward: 60,
    unlockCondition: (state) => state.level >= 5,
  },
];

@Injectable()
export class AchievementsService {
  private readonly store = new Map<string, UserAchievementState>();

  getProfile(userId: string) {
    const state = this.getOrCreate(userId);
    const { nextLevelXp, xpIntoLevel, xpForNextLevel } =
      this.computeLevelProgress(state.xp);
    return {
      xp: state.xp,
      level: state.level,
      levelStartXp: xpIntoLevel,
      nextLevelXp,
      xpForNextLevel,
      badges: state.badges,
      pet: this.computePetState(state.level),
      achievements: this.buildAchievementList(state),
      lastUpdated: state.lastUpdated,
    };
  }

  updateUser(userId: string, payload: UpdatePayload) {
    const state = this.getOrCreate(userId);
    const xpDelta = Math.max(0, payload.xpDelta ?? 0);
    if (xpDelta > 0) {
      state.xp += xpDelta;
    }
    state.lastUpdated = new Date().toISOString();

    let leveledUp = false;
    const initialLevel = state.level;
    const firstPass = this.recalculateLevel(state.xp, state.level);
    if (firstPass.leveledUp) {
      leveledUp = true;
      this.grantLevelBadges(state, state.level, firstPass.level);
      state.level = firstPass.level;
    }

    const newlyUnlocked = this.unlockAchievements(state);
    if (newlyUnlocked.length > 0) {
      const secondPass = this.recalculateLevel(state.xp, state.level);
      if (secondPass.leveledUp) {
        leveledUp = true;
        this.grantLevelBadges(state, state.level, secondPass.level);
        state.level = secondPass.level;
      }
    }

    const pet = this.computePetState(state.level);
    state.petStage = pet.stage;

    const levelProgress = this.computeLevelProgress(state.xp);

    return {
      xp: state.xp,
      xpDelta,
      level: state.level,
      leveledUp,
      levelStartXp: levelProgress.xpIntoLevel,
      nextLevelXp: levelProgress.nextLevelXp,
      xpForNextLevel: levelProgress.xpForNextLevel,
      badges: state.badges,
      newlyUnlocked,
      pet,
      lastUpdated: state.lastUpdated,
    };
  }

  listAchievements(userId: string) {
    const state = this.getOrCreate(userId);
    return this.buildAchievementList(state);
  }

  private getOrCreate(userId: string): UserAchievementState {
    if (!this.store.has(userId)) {
      this.store.set(userId, {
        xp: 0,
        level: 1,
        badges: ['Level 1'],
        petStage: 1,
        unlocked: {},
        lastUpdated: new Date().toISOString(),
      });
    }
    return this.store.get(userId)!;
  }

  private recalculateLevel(xp: number, currentLevel: number) {
    let newLevel = currentLevel;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
        break;
      }
    }
    return { level: newLevel, leveledUp: newLevel > currentLevel };
  }

  private unlockAchievements(state: UserAchievementState) {
    const unlocked: Array<{
      id: string;
      title: string;
      xpReward: number;
      unlockedAt: string;
      icon: string;
    }> = [];

    ACHIEVEMENTS.forEach((definition) => {
      if (state.unlocked[definition.id]) {
        return;
      }
      const conditionMet = definition.unlockCondition(state);
      if (conditionMet) {
        const unlockedAt = new Date().toISOString();
        state.unlocked[definition.id] = unlockedAt;
        state.xp += definition.xpReward;
        unlocked.push({
          id: definition.id,
          title: definition.title,
          xpReward: definition.xpReward,
          unlockedAt,
          icon: definition.icon,
        });
      }
    });

    return unlocked;
  }

  private buildAchievementList(state: UserAchievementState) {
    return ACHIEVEMENTS.map((definition) => ({
      id: definition.id,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      category: definition.category,
      rarity: definition.rarity,
      xpReward: definition.xpReward,
      unlocked: Boolean(state.unlocked[definition.id]),
      unlockedAt: state.unlocked[definition.id] ?? null,
      progress: this.computeProgress(definition, state),
    }));
  }

  private computeProgress(
    definition: AchievementDefinition,
    state: UserAchievementState,
  ) {
    if (state.unlocked[definition.id]) {
      return null;
    }
    switch (definition.id) {
      case 'xp-100':
        return { current: Math.min(state.xp, 100), target: 100 };
      case 'xp-500':
        return { current: Math.min(state.xp, 500), target: 500 };
      case 'level-3':
        return { current: Math.min(state.level, 3), target: 3 };
      case 'level-5':
        return { current: Math.min(state.level, 5), target: 5 };
      default:
        return { current: state.xp, target: 10 };
    }
  }

  private computePetState(level: number) {
    const stage = Math.min(5, Math.max(1, Math.floor((level - 1) / 2) + 1));
    const names = ['初生火花', '热情之焰', '跃动之翼', '光辉守护', '星火之心'];
    return {
      stage,
      label: names[stage - 1],
      mood: stage >= 4 ? 'excited' : stage >= 2 ? 'cheerful' : 'curious',
    };
  }

  private computeLevelProgress(xp: number) {
    let currentLevelIndex = 0;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        currentLevelIndex = i;
      } else {
        break;
      }
    }
    const levelStart = LEVEL_THRESHOLDS[currentLevelIndex];
    const nextLevelXp =
      LEVEL_THRESHOLDS[currentLevelIndex + 1] ?? levelStart + 500;
    return {
      xpIntoLevel: levelStart,
      nextLevelXp,
      xpForNextLevel: nextLevelXp - xp,
    };
  }

  private grantLevelBadges(
    state: UserAchievementState,
    fromLevel: number,
    toLevel: number,
  ) {
    for (let lvl = fromLevel + 1; lvl <= toLevel; lvl += 1) {
      const badge = `Level ${lvl}`;
      if (!state.badges.includes(badge)) {
        state.badges.push(badge);
      }
    }
  }
}
