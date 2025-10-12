import { apiGet, apiPost } from './api';

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'xp' | 'streak' | 'completion' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: { current: number; target: number } | null;
}

export interface AchievementProfile {
  xp: number;
  level: number;
  levelStartXp: number;
  nextLevelXp: number;
  xpForNextLevel: number;
  badges: string[];
  pet: {
    stage: number;
    label: string;
    mood: string;
  };
  achievements: AchievementItem[];
  lastUpdated: string;
}

export interface AchievementUpdateResponse {
  xp: number;
  xpDelta: number;
  level: number;
  leveledUp: boolean;
  levelStartXp: number;
  nextLevelXp: number;
  xpForNextLevel: number;
  badges: string[];
  newlyUnlocked: Array<{
    id: string;
    title: string;
    xpReward: number;
    unlockedAt: string;
    icon: string;
  }>;
  pet: {
    stage: number;
    label: string;
    mood: string;
  };
  lastUpdated: string;
}

const defaultUserId = 'demo';

export async function fetchAchievementProfile(userId: string = defaultUserId) {
  return apiGet<AchievementProfile>(`/api/achievements/profile?userId=${userId}`);
}

export async function fetchAchievementList(userId: string = defaultUserId) {
  return apiGet<AchievementItem[]>(`/api/achievements?userId=${userId}`);
}

export async function updateAchievements(payload: {
  userId?: string;
  xpDelta: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  return apiPost<AchievementUpdateResponse>('/api/achievements/update', {
    userId: payload.userId ?? defaultUserId,
    xpDelta: payload.xpDelta,
    reason: payload.reason,
    metadata: payload.metadata,
  });
}
