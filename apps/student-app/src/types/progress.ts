// 学习事件类型
export type LearnEventType = 'LEVEL_ATTEMPT' | 'SESSION_START' | 'SESSION_END';

export interface LearnEvent {
  type: LearnEventType;
  studentId: string;
  levelId?: string;
  passed?: boolean;
  timeMs?: number;
  durationMin?: number;
  ts: string;
}

// 日统计数据
export interface DailyStat {
  date: string; // 'YYYY-MM-DD' (Asia/Tokyo)
  studyMinutes: number;
  attempts: number;
  passes: number;
  levelsCompleted: string[]; // 当天首次通过的 levelId
}

// 成就/徽章
export interface Achievement {
  id: string;
  title: string;
  desc?: string;
  gainedAt: string;
  icon?: string;
  tier?: 'bronze' | 'silver' | 'gold';
}

// 首页数据
export interface HomeSnapshot {
  studentId: string;
  xp: number;
  streakDays: number;
  today: {
    studyMinutes: number;
    attempts: number;
    passes: number;
  };
  packages: Array<{
    pkgId: string;
    title: string;
    completed: number;
    total: number;
    percent: number;
  }>;
  nextLesson?: {
    levelId: string;
    pkgId: string;
    title: string;
  };
  recent: Array<{
    levelId: string;
    passed: boolean;
    ts: string;
  }>;
  achievements: Achievement[];
}

// 课程包进度
export interface PackageProgress {
  pkgId: string;
  levels: Array<{
    levelId: string;
    status: 'done' | 'in_progress' | 'locked';
  }>;
  completed: number;
  total: number;
  percent: number;
  ts?: number; // 缓存时间戳
}

// 关卡状态类型
export type LevelState = 'done' | 'in_progress' | 'locked';