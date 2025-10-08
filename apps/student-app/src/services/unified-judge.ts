/**
 * 统一的判题和进度管理服务
 * 支持新旧两套系统，逐步迁移到新 API
 */

import type { Level } from '@kids/types';
import { execute, judge as judgeApi } from './judge';
import { updateProgress, getNextLevel } from './progress';
// import type { RunAndJudgeResult } from '../lib/runAndJudge';

export interface UnifiedJudgeOptions {
  level: Level;
  code: string;
  language?: string; // 如果是新系统，需要提供语言
  game?: string; // 如果是新系统，需要提供游戏类型
}

export interface UnifiedJudgeResult {
  // 标准化的判题结果，兼容新旧格式
  passed: boolean;
  message: string;
  details?: any;
  score?: number;
  
  // 执行结果
  exec: {
    stdout?: string;
    stderr?: string;
    durationMs: number;
  };
  
  // 可视化数据
  artifacts?: {
    raw?: Record<string, unknown>;
    ioCases?: Array<{ input: string; expected: string; actual: string; passed: boolean }>;
    eventCases?: Array<{
      label: string;
      expected: string[];
      actual: string[];
      passed: boolean;
    }>;
    pixelMatrix?: number[][];
    musicSeq?: Array<{ pitch: string; duration: number }>;
    referenceSolution?: string;
  };
}

/**
 * 检测关卡是否来自新系统（curriculum API）
 */
function isNewSystemLevel(level: Level): boolean {
  // 新系统的关卡会有 judge.type 字段
  return !!(level as any).judge?.type;
}

/**
 * 将新系统的判题类型映射到执行参数
 */
function collectJudgePayload(execRes: any, level: Level): any {
  const judgeConfig = (level as any).judge || {};
  const type = judgeConfig.type || 'stdout_compare';
  const criteria = judgeConfig.criteria || {};
  
  switch (type) {
    case 'stdout_compare':
      return {
        type,
        criteria,
        payload: { stdout: execRes?.stdout ?? '' },
      };
      
    case 'unit_tests':
      return {
        type,
        criteria,
        payload: {
          result: execRes?.result,
          expected: (level as any).expected_io?.output,
        },
      };
      
    case 'api_events':
      return {
        type,
        criteria,
        payload: {
          meta: { reached: true, steps: 10 },
          events: execRes?.events ?? [],
        },
      };
      
    case 'svg_path_similarity':
      return {
        type,
        criteria,
        payload: { segments: execRes?.segments ?? [] },
      };
      
    default:
      // 默认使用 stdout 比对
      return {
        type: 'stdout_compare',
        criteria: { mode: 'exact', expected: '' },
        payload: { stdout: execRes?.stdout ?? '' },
      };
  }
}

/**
 * 统一的判题入口
 */
export async function unifiedJudge(options: UnifiedJudgeOptions): Promise<UnifiedJudgeResult> {
  const { level, code, language, game } = options;
  const start = performance.now();
  
  // 检测是否为新系统
  const useNewAPI = isNewSystemLevel(level);
  
  if (useNewAPI && language && game) {
    // 使用新系统的真实 API
    try {
      // 1. 执行代码
      const execRes: any = await execute({ language, code });
      
      // 2. 收集判题数据
      const judgeReq = collectJudgePayload(execRes, level);
      
      // 3. 调用判题 API
      const judgeRes: any = await judgeApi(judgeReq);
      
      const durationMs = performance.now() - start;
      
      // 4. 如果通过，更新进度
      if (judgeRes?.pass) {
        try {
          const levelNum = (level as any).level || extractLevelNumber(level.id);
          await updateProgress({
            language,
            game,
            level: levelNum,
            durationMs,
          });
        } catch (err) {
          console.warn('更新进度失败:', err);
        }
      }
      
      // 5. 返回统一格式
      return {
        passed: judgeRes?.pass ?? false,
        message: judgeRes?.message || (judgeRes?.pass ? '通过！' : '未通过'),
        details: judgeRes?.details,
        score: judgeRes?.score,
        exec: {
          stdout: execRes?.stdout ?? '',
          stderr: execRes?.stderr ?? '',
          durationMs,
        },
        artifacts: {
          raw: judgeRes as Record<string, unknown>,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '判题失败';
      return {
        passed: false,
        message,
        exec: {
          stderr: message,
          durationMs: performance.now() - start,
        },
      };
    }
  }
  
  // 否则使用老系统的模拟判题（向后兼容）
  const { runAndJudge } = await import('../lib/runAndJudge');
  const result = await runAndJudge({ level, code });
  
  // 将老格式转换为统一格式
  return {
    passed: result.judge.passed,
    message: result.judge.message,
    details: result.judge.details,
    exec: result.exec,
    artifacts: result.artifacts,
  };
}

/**
 * 获取下一关 ID（兼容新旧系统）
 */
export async function getNextLevelId(options: {
  currentLevel: Level;
  language?: string;
  game?: string;
}): Promise<string | null> {
  const { currentLevel, language, game } = options;
  
  const useNewAPI = isNewSystemLevel(currentLevel);
  
  if (useNewAPI && language && game) {
    // 使用新 API 获取下一关
    try {
      const { nextLevel, finished } = await getNextLevel({ language, game });
      if (finished) return null;
      return `${language}-${game}-${nextLevel}`; // 返回格式：python-maze_navigator-2
    } catch (err) {
      console.warn('获取下一关失败:', err);
      return null;
    }
  }
  
  // 老系统：优先使用同类型游戏的下一关
  const { pickNextLevelInSameGame, pickNextLevel } = await import('./level.repo');
  const { progressStore } = await import('../store/progress');
  const progress = progressStore.getProgress();
  
  // 首先尝试找到同类型游戏的下一关
  const nextInSameGame = await pickNextLevelInSameGame(currentLevel, progress.completedLevels);
  if (nextInSameGame) {
    return (nextInSameGame as any).id ?? null;
  }
  
  // 如果没有同类型游戏的下一关，再使用通用的下一关选择
  const next = await pickNextLevel(progress.completedLevels);
  return next?.id ?? null;
}

/**
 * 标记关卡完成（兼容老系统）
 */
export function markLevelDone(levelId: string, xp: number = 10, coins: number = 5) {
  // 为老系统保存本地进度
  if (!isNewLevelId(levelId)) {
    import('../store/progress').then(({ progressStore }) => {
      progressStore.completeLevel(levelId, xp, coins);
    });
  }
  // 新系统的进度已在 unifiedJudge 中保存到后端
}

/**
 * 检测 levelId 是否为新格式（language-game-level）
 */
function isNewLevelId(levelId: string): boolean {
  return /^[a-z]+-[a-z_]+-\d+$/.test(levelId);
}

/**
 * 从 levelId 提取关卡编号
 */
function extractLevelNumber(levelId: string): number {
  const match = levelId.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 1;
}

