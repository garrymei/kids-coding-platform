/**
 * 统一判题接口 - 避免在策略里解析代码，统一使用执行产物
 */

export interface JudgeInput {
  strategy: string;
  expected: any;
  // 来自执行器的产物：stdout 原文、事件数组（已由 eventParser 解析）、二进制或结构化产物
  output: {
    stdout?: string;
    events?: Array<Record<string, any>>;
    artifacts?: Record<string, any>; // 如: { pixelMatrix, musicSeq, imageData }
  };
  args?: any;               // 判题辅助参数（阈值/容差/窗口等）
  metadata?: Record<string, any>; // 追踪信息（levelId, lang…）
}

export interface JudgeResult {
  passed: boolean;
  message: string;
  details?: string;
  visualization?: any;      // 前端可视化需要的数据
  metrics?: Record<string, number>; // 判题内部指标（命中率/相似度/编辑距离等）
  diff?: any;               // 差异数据结构，便于前端高亮
  warnings?: string[];      // 非致命警告（节拍偏差、像素尺寸自适应等）
}

export interface JudgeStrategy {
  name: string;
  judge(input: JudgeInput): JudgeResult;
}

/**
 * 像素矩阵类型定义
 */
export type PixelMatrix = {
  width: number;
  height: number;
  pixels: number[][] | number[][][]; // 灰度 or RGB
};

export type PixelExpected = PixelMatrix | {
  imageData: Uint8Array;
  width: number;
  height: number;
  mode: 'rgba' | 'gray';
};

export type PixelArgs = {
  tolerance?: number;
  similarityThreshold?: number;
  mode?: 'gray' | 'binary' | 'rgb';
  perChannelTolerance?: number;
  allowScale?: boolean; // 是否允许缩放到相同尺寸
};

/**
 * 音乐序列类型定义
 */
export type Note = {
  pitch: string;
  dur: number;
  start: number;
};

export type MusicSequence = {
  tempo: number;
  notes: Note[];
};

export type MusicArgs = {
  tempoTolerance?: number;        // BPM 容差（默认 ±2）
  onsetWindow?: number;           // 起始时间窗口（拍），默认 0.05
  durTolerance?: number;          // 时值容差（拍），默认 0.05
  scoreThreshold?: number;        // 通过阈值，默认 0.85
  pitchEquivalence?: 'strict' | 'ignoreOctave' | 'nearest'; // 可选进阶
};

/**
 * 音乐判题结果中的可视化数据
 */
export interface MusicVisualization {
  expected: MusicSequence;
  actual: MusicSequence;
  matchedNotes: Note[];
  missingNotes: Note[];
  extraNotes: Note[];
  rhythmErrors: Array<{
    note: Note;
    expected: Note;
    error: 'duration' | 'timing';
    deviation: number;
  }>;
  pitchErrors: Array<{
    note: Note;
    expected: Note;
    error: 'pitch';
  }>;
}

/**
 * 像素判题结果中的可视化数据
 */
export interface PixelVisualization {
  expected: PixelMatrix;
  actual: PixelMatrix;
  diffMatrix: number[][]; // 差异矩阵，0=匹配，1=不匹配
}
