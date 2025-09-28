// 关卡系统类型定义

export interface GamePack {
  lang: string;
  gameType: string;
  world: string;
  name: string;
  summary: string;
  unlock: {
    requires: string[];
    minLevel: number;
  };
  rewards: {
    badges: string[];
    firstClearBonusXP: number;
  };
  levelCount: number;
}

export interface Level {
  id: string;
  title: string;
  lang: string;
  gameType: string;
  difficulty: number;
  goals: string[];
  story?: string;
  starter?: {
    blockly?: string;
    code?: string;
  };
  grader: {
    mode: string;
    io?: {
      cases: Array<{ in: string; out: string }>;
      match: string;
    };
    constraints?: {
      maxTimeMs?: number;
      maxMemMB?: number;
      forbiddenImports?: string[];
    };
  };
  rewards: {
    xp: number;
    coins: number;
    badges: string[];
  };
  hints?: string[];
  path: string;
}

export interface LevelManifest {
  packs: GamePack[];
  levels: Level[];
}

export interface Grader {
  mode: 'io' | 'event' | 'matrix';
  io?: {
    cases: Array<{
      in: string;
      out: string;
    }>;
    match: 'exact' | 'tolerance' | 'regex';
    tolerance?: number;
    pattern?: string;
  };
  events?: {
    channel: string;
    collectFromStdout?: boolean;
    collectFromAPI?: boolean;
    mapRule?: string;
    expectedGoal?: string;
  };
  checks?: Array<{
    type: 'eventSeq' | 'goal' | 'maxSteps';
    expect?: string[];
    name?: string;
    must?: boolean;
    value?: number;
  }>;
  constraints?: {
    maxTimeMs?: number;
    maxMemMB?: number;
    forbiddenImports?: string[];
    requireStructures?: string[];
  };
}

export interface LevelDetail extends Level {
  starter: {
    blockly: string;
    code: string;
  };
  assets?: Record<string, any>;
  grader: Grader;
  hints?: string[];
  examples?: Array<Record<string, any>>;
}

// 难度等级常量
export const Difficulty = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  CHALLENGE: 4,
  EXPERT: 5,
} as const;

// 游戏类型常量
export const GameType = {
  IO: 'io',
  LED: 'led',
  MAZE: 'maze',
  PIXEL: 'pixel',
  MUSIC: 'music',
  OPEN: 'open',
} as const;

// 语言常量
export const Language = {
  PYTHON: 'python',
  JAVASCRIPT: 'javascript',
} as const;