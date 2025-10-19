import { useState } from 'react';
import { Card, Button } from '@kids/ui-kit';
import type { Level } from '../../services/level.repo';
import { progressStore } from '../../store/progress';
import { httpClient } from '../../services/http';
import { useStudentActions } from '../../store/studentStore';
import { updateProgress } from '../../services/progress';
import { useAuthStore } from '../../stores/auth';
import {
  LEDVisualizer,
  LED_PALETTES,
  LEDPaletteKey,
  LEDEvent,
} from '../../components/LEDVisualizer';

interface JudgeResult {
  passed: boolean;
  message: string;
  details?: string;
  events?: LEDEvent[];
  finalState?: string;
}

export function LEDRunner({ level }: { level: Level }) {
  const [code, setCode] = useState(level.starter?.code || '');
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [events, setEvents] = useState<LEDEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useRemoteJudge, setUseRemoteJudge] = useState(false);
  const [msPerTick, setMsPerTick] = useState<number>(500);
  const [paletteKey, setPaletteKey] = useState<LEDPaletteKey>('amber');
  const { refreshStats } = useStudentActions();

  // 将终局状态字符串转换为静态事件序列（用于无事件但有 finalState 的情况）
  const convertFinalStateToEvents = (state: string | undefined, pixelCount: number): LEDEvent[] => {
    if (!state) return [];
    const normalized = state.replace(/[^01]/g, '');
    const events: LEDEvent[] = [];
    for (let i = 0; i < Math.min(normalized.length, pixelCount); i += 1) {
      if (normalized[i] === '1') {
        events.push({
          type: 'on',
          index: i,
          timestamp: i,
          timeOffsetMs: i * 140,
          b: 1,
        });
      }
    }
    return events;
  };

  // 解析代码中的LED事件（支持 on/off 索引与坐标 on{x},{y} 的字面量），用于可视化
  const parseLEDEvents = (code: string): LEDEvent[] => {
    const events: LEDEvent[] = [];
    let timestamp = 0;
    const gridWidth = (level as any).assets?.gridWidth || 8;

    // 简单颜色名映射
    const namedColor: Record<string, string> = {
      red: '#ff0000',
      green: '#00ff00',
      blue: '#0000ff',
      yellow: '#ffd700',
      cyan: '#00ffff',
      magenta: '#ff00ff',
      orange: '#ffa500',
      purple: '#800080',
      white: '#ffffff',
    };

    // 2) 解析函数定义并收集函数体内事件（字面量，按行缩进识别）
    const funcTokens: Record<string, Array<{ type: 'on' | 'off'; index: number }>> = {};
    {
      const lines = code.split(/\r?\n/);
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        const m = line.match(/^def\s+(\w+)\s*\(\s*\)\s*:\s*$/);
        if (!m) {
          i += 1;
          continue;
        }
        const name = m[1];
        const bodyEvents: Array<{ type: 'on' | 'off'; index: number }> = [];
        i += 1;
        while (i < lines.length) {
          const bodyLine = lines[i];
          if (bodyLine.trim() === '') {
            i += 1;
            continue;
          }
          // 任何缩进（空格或Tab）都视为函数体；非缩进视为函数体结束
          if (!/^\s/.test(bodyLine)) break;
          const single = bodyLine.match(/print\s*\(\s*['"]\s*(on|off)\s*(\d+)\s*['"]\s*\)/i);
          if (single) {
            bodyEvents.push({
              type: single[1].toLowerCase() as 'on' | 'off',
              index: Number(single[2]),
            });
          }
          const xy = bodyLine.match(
            /print\s*\(\s*['"]\s*(on|off)\s*(\d+)\s*,\s*(\d+)\s*['"]\s*\)/i,
          );
          if (xy) {
            const type = xy[1].toLowerCase() as 'on' | 'off';
            const idx = Number(xy[2]);
            const idy = Number(xy[3]);
            const index = idy * gridWidth + idx;
            bodyEvents.push({ type, index });
          }
          i += 1;
        }
        funcTokens[name] = bodyEvents;
      }
    }

    // 行级解析：支持 sleep(ms) / time.sleep(s) 累计时间，以及字面量 print
    const lines = code.split('\n');
    let cumulativeMs = 0;
    for (const rawLine of lines) {
      const line = rawLine.trim();

      // 解析并累计本行的 sleep 时间
      const sleepRe = /(time\s*\.\s*sleep|sleep)\s*\(\s*(\d*\.\d+|\d+)\s*(ms|s)?\s*\)/gi;
      let sm: RegExpExecArray | null;
      let addedMs = 0;
      while ((sm = sleepRe.exec(line)) !== null) {
        const isTimeSleep = sm[1].toLowerCase().includes('time');
        const val = Number(sm[2]);
        const unit = (sm[3] || '').toLowerCase();
        if (!Number.isFinite(val)) continue;
        let msVal = 0;
        if (unit === 'ms') msVal = val;
        else if (unit === 's' || (!unit && isTimeSleep)) msVal = val * 1000;
        else msVal = val; // 默认 sleep(n) 视为毫秒
        addedMs += msVal;
      }
      cumulativeMs += addedMs;

      // 解析本行的字面量 print 事件（索引或坐标）
      let lm: RegExpExecArray | null;
      const localPrintRe = /print\s*\(\s*['"]([^'"]+)['"]\s*\)/gi;
      while ((lm = localPrintRe.exec(line)) !== null) {
        const content = lm[1].trim();
        const base = /^(on|off)\s*(\d+)(?:\s*,\s*(\d+))?/i.exec(content);
        if (!base) continue;
        const type = base[1].toLowerCase() as 'on' | 'off';
        const xOrIdx = Number(base[2]);
        const yMaybe = base[3] ? Number(base[3]) : undefined;

        let index: number;
        if (typeof yMaybe === 'number') {
          if (Number.isNaN(xOrIdx) || Number.isNaN(yMaybe)) continue;
          index = yMaybe * gridWidth + xOrIdx;
        } else {
          if (Number.isNaN(xOrIdx)) continue;
          index = xOrIdx;
        }

        // 修饰语解析：时间偏移、亮度、颜色
        let explicitOffset: number | undefined;
        const tm = /@\s*(\d+)/i.exec(content);
        if (tm) {
          const ms = Number(tm[1]);
          if (!Number.isNaN(ms)) explicitOffset = ms;
        }

        let b: number | undefined;
        const bm = /\bb\s*=\s*(\d*\.\d+|\d+)/i.exec(content);
        if (bm) {
          const v = Number(bm[1]);
          if (!Number.isNaN(v)) b = Math.max(0, Math.min(1, v));
        }

        let color: string | undefined;
        const cm = /\bc\s*=\s*([^\s]+)/i.exec(content);
        if (cm) {
          const raw = cm[1].trim();
          color = namedColor[raw.toLowerCase()] || raw;
        }

        const timeOffsetMs = (explicitOffset ?? 0) + cumulativeMs;
        events.push({ type, index, timestamp: timestamp++, timeOffsetMs, b, color });
      }
    }

    // 3) 解析 f-string 坐标打印与典型循环：
    const xRange = code.match(/for\s+x\s+in\s+range\s*\(\s*(\d+)\s*\)/i);
    const yRange = code.match(/for\s+y\s+in\s+range\s*\(\s*(\d+)\s*\)/i);
    const hasOnXYFmt = /print\s*\(\s*f?['"][^'"]*\{x\}\s*,\s*\{y\}[^'"]*['"]\s*\)/i.test(code);
    const hasOffXYFmt =
      /print\s*\(\s*f?['"][^'"]*off\s*\{x\}\s*,\s*\{y\}[^'"]*['"]\s*\)/i.test(code) ||
      /print\s*\(\s*f?['"][^'"]*(off)\s*\{x\}\s*,\s*\{y\}[^'"]*['"]\s*\)/i.test(code);
    if (xRange && yRange && hasOnXYFmt) {
      const nx = Number(xRange[1]);
      const ny = Number(yRange[1]);
      for (let x = 0; x < nx; x++) {
        for (let y = 0; y < ny; y++) {
          const index = y * gridWidth + x;
          events.push({ type: 'on', index, timestamp: timestamp++ });
        }
        if (hasOffXYFmt) {
          for (let y = 0; y < ny; y++) {
            const index = y * gridWidth + x;
            events.push({ type: 'off', index, timestamp: timestamp++ });
          }
        }
      }
    }

    // 4) 解析单索引 f-string 打印与循环：
    const idxLoop = code.match(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/i);
    if (idxLoop) {
      const varName = idxLoop[1];
      const n = Number(idxLoop[2]);
      const hasOnIdxFmt = new RegExp(
        `print\\s*\\(\\s*f?['"]\\s*on\\s*\\{${varName}\\}\\s*['"]\\s*\\)`,
        'i',
      ).test(code);
      const hasOffIdxFmt = new RegExp(
        `print\\s*\\(\\s*f?['"]\\s*off\\s*\\{${varName}\\}\\s*['"]\\s*\\)`,
        'i',
      ).test(code);
      for (let i = 0; i < n; i++) {
        if (hasOnIdxFmt) events.push({ type: 'on', index: i, timestamp: timestamp++ });
        if (hasOffIdxFmt) events.push({ type: 'off', index: i, timestamp: timestamp++ });
      }
    }

    // 5) 展开函数调用与循环（使用上面解析的函数体事件）
    // 多行缩进调用：for ... in range(N):\n  func()
    const loopCallRe = /for\s+\w+\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:\s*\n[ \t]+(\w+)\s*\(\s*\)/gm;
    {
      let lc: RegExpExecArray | null;
      while ((lc = loopCallRe.exec(code)) !== null) {
        const repeat = Number(lc[1]);
        const fname = lc[2];
        const seq = funcTokens[fname] || [];
        for (let r = 0; r < repeat; r++) {
          for (const ev of seq) {
            events.push({ type: ev.type, index: ev.index, timestamp: timestamp++ });
          }
        }
      }
    }

    // 单行调用：for ... in range(N): func()
    const singleLineLoopRe = /for\s+\w+\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:\s*(\w+)\s*\(\s*\)/gm;
    {
      let sl: RegExpExecArray | null;
      while ((sl = singleLineLoopRe.exec(code)) !== null) {
        const repeat = Number(sl[1]);
        const fname = sl[2];
        const seq = funcTokens[fname] || [];
        for (let r = 0; r < repeat; r++) {
          for (const ev of seq) {
            events.push({ type: ev.type, index: ev.index, timestamp: timestamp++ });
          }
        }
      }
    }

    // 顶层直接调用：func()
    const directCallRe = /^\s*(\w+)\s*\(\s*\)\s*$/gm;
    {
      let dc: RegExpExecArray | null;
      while ((dc = directCallRe.exec(code)) !== null) {
        const fname = dc[1];
        const seq = funcTokens[fname] || [];
        for (const ev of seq) {
          events.push({ type: ev.type, index: ev.index, timestamp: timestamp++ });
        }
      }
    }

    // 回退：按行扫描 for-range 缩进调用
    if (!/for\s+\w+\s+in\s+range\s*\(\s*\d+\s*\)\s*:\s*\n[ \t]+\w+\s*\(\s*\)/.test(code)) {
      const lines2 = code.split(/\r?\n/);
      for (let i = 0; i < lines2.length; i++) {
        const line = lines2[i].trim();
        const m = line.match(/^for\s+\w+\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:\s*$/);
        if (!m) continue;
        const repeat = Number(m[1]);
        const nextLine = lines2[i + 1] || '';
        const call = nextLine.match(/^\s+(\w+)\s*\(\s*\)\s*$/);
        if (!call) continue;
        const fname = call[1];
        const seq = funcTokens[fname] || [];
        for (let r = 0; r < repeat; r++) {
          for (const ev of seq) {
            events.push({ type: ev.type, index: ev.index, timestamp: timestamp++ });
          }
        }
      }
    }

    return events;
  };

  // 从源码中提取事件token（不用于可视化，仅用于判题对比）。
  const extractEventTokens = (code: string): string[] => {
    const tokens: string[] = [];

    // 1. 提取函数体事件（按行解析缩进，不限四空格）
    const functionEvents: { [funcName: string]: string[] } = {};
    {
      const lines = code.split(/\r?\n/);
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        const m = line.match(/^def\s+(\w+)\s*\(\s*\)\s*:\s*$/);
        if (!m) {
          i += 1;
          continue;
        }
        const funcName = m[1];
        const seq: string[] = [];
        i += 1;
        while (i < lines.length) {
          const bodyLine = lines[i];
          if (bodyLine.trim() === '') {
            i += 1;
            continue;
          }
          if (!/^\s/.test(bodyLine)) break;
          const s1 = bodyLine.match(/print\s*\(\s*['"]\s*(on|off)\s*(\d+)\s*['"]\s*\)/i);
          if (s1) seq.push(`${s1[1].toLowerCase()}${Number(s1[2])}`);
          const s2 = bodyLine.match(
            /print\s*\(\s*['"]\s*(on|off)\s*(\d+)\s*,\s*(\d+)\s*['"]\s*\)/i,
          );
          if (s2) seq.push(`${s2[1].toLowerCase()}${Number(s2[2])},${Number(s2[3])}`);
          i += 1;
        }
        functionEvents[funcName] = seq;
      }
    }

    // 2. 展开循环调用：for _ in range(N):\n  func()
    const loopCallRe = /for\s+\w+\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:\s*\n[ \t]+(\w+)\s*\(\s*\)/gm;
    {
      let lc: RegExpExecArray | null;
      while ((lc = loopCallRe.exec(code)) !== null) {
        const repeat = Number(lc[1]);
        const fname = lc[2];
        const seq = functionEvents[fname] || [];
        for (let r = 0; r < repeat; r++) tokens.push(...seq);
      }
    }

    // 3. 展开单行循环调用：for _ in range(N): func()
    const singleLineLoopRe = /for\s+\w+\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:\s*(\w+)\s*\(\s*\)/gm;
    {
      let sl: RegExpExecArray | null;
      while ((sl = singleLineLoopRe.exec(code)) !== null) {
        const repeat = Number(sl[1]);
        const fname = sl[2];
        const seq = functionEvents[fname] || [];
        for (let r = 0; r < repeat; r++) tokens.push(...seq);
      }
    }

    // 4. 顶层直接调用：func()
    const directCallRe = /^\s*(\w+)\s*\(\s*\)\s*$/gm;
    {
      let dc: RegExpExecArray | null;
      while ((dc = directCallRe.exec(code)) !== null) {
        const fname = dc[1];
        tokens.push(...(functionEvents[fname] || []));
      }
    }

    // 回退：按行寻找 for-range + 缩进调用
    if (!/for\s+\w+\s+in\s+range\s*\(\s*\d+\s*\)\s*:\s*\n[ \t]+\w+\s*\(\s*\)/.test(code)) {
      const lines = code.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const m = line.match(/^for\s+\w+\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:\s*$/);
        if (!m) continue;
        const repeat = Number(m[1]);
        const nextLine = lines[i + 1] || '';
        const call = nextLine.match(/^\s+(\w+)\s*\(\s*\)\s*$/);
        if (!call) continue;
        const fname = call[1];
        const seq = functionEvents[fname] || [];
        for (let r = 0; r < repeat; r++) tokens.push(...seq);
      }
    }

    // 5. 处理顶层直接的 print 语句（不在函数内的）
    const codeWithoutFunctions = code.replace(
      /^def\s+\w+\s*\(\s*\)\s*:\s*\n((?:[ \t].*\n)+)/gm,
      '',
    );
    const singleReTop = /print\s*\(\s*['"]\s*(on|off)\s*(\d+)\s*['"]\s*\)/gi;
    {
      let sTop: RegExpExecArray | null;
      while ((sTop = singleReTop.exec(codeWithoutFunctions)) !== null) {
        tokens.push(`${sTop[1].toLowerCase()}${Number(sTop[2])}`);
      }
    }
    const xyReTop = /print\s*\(\s*['"]\s*(on|off)\s*(\d+)\s*,\s*(\d+)\s*['"]\s*\)/gi;
    {
      let tTop: RegExpExecArray | null;
      while ((tTop = xyReTop.exec(codeWithoutFunctions)) !== null) {
        tokens.push(`${tTop[1].toLowerCase()}${Number(tTop[2])},${Number(tTop[3])}`);
      }
    }

    // 6. 简单坐标循环 + f-string
    const xRange = code.match(/for\s+x\s+in\s+range\s*\(\s*(\d+)\s*\)/i);
    const yRange = code.match(/for\s+y\s+in\s+range\s*\(\s*(\d+)\s*\)/i);
    const hasOnXYFmt = /print\s*\(\s*f?['"][^'"]*\{x\}\s*,\s*\{y\}[^'"]*['"]\s*\)/i.test(code);
    const hasOffXYFmt =
      /print\s*\(\s*f?['"][^'"]*off\s*\{x\}\s*,\s*\{y\}[^'"]*['"]\s*\)/i.test(code) ||
      /print\s*\(\s*f?['"][^'"]*(off)\s*\{x\}\s*,\s*\{y\}[^'"]*['"]\s*\)/i.test(code);
    if (xRange && yRange && hasOnXYFmt) {
      const nx = Number(xRange[1]);
      const ny = Number(yRange[1]);
      for (let x = 0; x < nx; x++) {
        for (let y = 0; y < ny; y++) tokens.push(`on${x},${y}`);
        if (hasOffXYFmt) {
          for (let y = 0; y < ny; y++) tokens.push(`off${x},${y}`);
        }
      }
    }

    // 7. 单索引 f-string + 循环
    const idxLoop = code.match(/for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:/i);
    if (idxLoop) {
      const varName = idxLoop[1];
      const n = Number(idxLoop[2]);
      const hasOnIdxFmt = new RegExp(
        `print\\s*\\(\\s*f?['"]\\s*on\\s*\\{${varName}\\}\\s*['"]\\s*\\)`,
        'i',
      ).test(code);
      const hasOffIdxFmt = new RegExp(
        `print\\s*\\(\\s*f?['"]\\s*off\\s*\\{${varName}\\}\\s*['"]\\s*\\)`,
        'i',
      ).test(code);
      for (let i = 0; i < n; i++) {
        if (hasOnIdxFmt) tokens.push(`on${i}`);
        if (hasOffIdxFmt) tokens.push(`off${i}`);
      }
    }

    return tokens;
  };

  // 模拟 io 终局字符串（复制自 runAndJudge.ts 的简化版）
  const simulateLedIoFinalString = (code: string): string => {
    const literalPrint = code.match(/print\s*\(\s*['"]([01]{2,})['"]\s*\)/);
    if (literalPrint) return literalPrint[1];

    const hasJoin = /join\s*\(/.test(code) && /for\s+\w+\s+in\s+range\s*\(/.test(code);
    const hasOneZero = /['"]1['"]/.test(code) && /['"]0['"]/.test(code);
    if (hasJoin && hasOneZero && /print\s*\(/.test(code)) {
      let width = 8;
      const m = code.match(/range\s*\(\s*(\d+)\s*\)/);
      if (m) width = Number(m[1]) || width;
      const startWithOne = /i\s*%\s*2\s*==\s*0/.test(code) || /i\s*&\s*1\s*==\s*0/.test(code);
      const startWithZero = /i\s*%\s*2\s*==\s*1/.test(code) || /i\s*&\s*1\s*==\s*1/.test(code);
      let s = '';
      for (let i = 0; i < width; i++) {
        if (startWithOne) s += i % 2 === 0 ? '1' : '0';
        else if (startWithZero) s += i % 2 === 0 ? '0' : '1';
        else s += i % 2 === 0 ? '1' : '0';
      }
      return s;
    }
    if (
      /for\s+\w+\s+in\s+range\s*\(\s*8\s*\)/.test(code) &&
      /print\s*\(/.test(code) &&
      /i\s*%\s*2/.test(code)
    ) {
      let s = '';
      for (let i = 0; i < 8; i++) s += i % 2 === 0 ? '1' : '0';
      return s;
    }
    return '';
  };

  // 远程判题逻辑
  const judgeLEDRemote = async (): Promise<JudgeResult> => {
    try {
      const response: any = await httpClient.post('/judge/led', {
        body: JSON.stringify({
          code,
          grader: level.grader,
          assets: (level as any).assets,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return {
        passed: response.ok,
        message: response.message,
        details: response.details,
        events: response.events || [],
        finalState: response.finalState,
      };
    } catch (error) {
      return {
        passed: false,
        message: '❌ 远程判题失败',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  };

  // 本地判题逻辑
  const judgeLED = (): JudgeResult => {
    if (!level.grader) {
      return {
        passed: false,
        message: '关卡配置错误：缺少判题配置',
      };
    }

    try {
      const parsedEvents = parseLEDEvents(code);
      setEvents(parsedEvents);

      if (level.grader.mode === 'event') {
        // 事件判题（支持 eventSeq / eventSet；支持坐标 token onX,Y / offX,Y）
        const check = (level.grader as any).checks?.[0] || {};
        const expectedEvents: string[] = check.expect || [];
        const checkType: string = check.type || 'eventSeq';

        // 提取 token（代码中可能是字面量或常见循环打印）
        const actualTokens = extractEventTokens(code);
        const expectedHasXY = expectedEvents.some((e) => /,/.test(e));

        // 若期望是 onN/offN，则也兼容从 parsedEvents 映射的结果
        const actualFromParsed = parsedEvents.map((e) => `${e.type}${e.index}`);
        const actualEvents = expectedHasXY
          ? actualTokens
          : actualTokens.length > actualFromParsed.length
            ? actualTokens
            : actualFromParsed;

        let passed = false;
        if (checkType === 'eventSet') {
          const setEq = (a: string[], b: string[]) => {
            const as = new Set(a);
            const bs = new Set(b);
            if (as.size !== bs.size) return false;
            for (const v of as) if (!bs.has(v)) return false;
            return true;
          };
          passed = setEq(actualEvents, expectedEvents);
        } else {
          passed = JSON.stringify(actualEvents) === JSON.stringify(expectedEvents);
        }

        return {
          passed,
          message: passed ? '🎉 事件匹配正确！' : '❌ 事件不匹配',
          details: `期望(${checkType}): [${expectedEvents.join(', ')}]\n实际: [${actualEvents.join(', ')}]`,
          events: parsedEvents,
        };
      } else if (level.grader.mode === 'io') {
        // IO 输出判题（基于终局字符串的推断，而非事件）
        const expectedOutput = (level.grader as any).io?.cases?.[0]?.out?.trim() || '';
        const finalString = simulateLedIoFinalString(code).trim();
        const passed = finalString === expectedOutput;

        return {
          passed,
          message: passed ? '🎉 输出字符串正确！' : '❌ 输出字符串不匹配',
          details: `期望: ${expectedOutput}\n实际: ${finalString || '(未能推断)'}`,
          events: parsedEvents,
          finalState: finalString,
        };
      }

      return {
        passed: false,
        message: '不支持的判题模式',
      };
    } catch (error) {
      return {
        passed: false,
        message: '❌ 解析出错',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    setShowReward(false);
    setCurrentTime(0);
    setIsPlaying(false);

    try {
      let result: JudgeResult;

      if (useRemoteJudge) {
        // 远程判题
        result = await judgeLEDRemote();
      } else {
        // 本地判题
        result = judgeLED();
      }

      setResult(result);

      // 如果通关，更新进度并显示奖励
      if (result.passed) {
        progressStore.completeLevel(level.id, level.rewards.xp, level.rewards.coins);
        // Refresh student stats to update streak and XP
        refreshStats();
        // 持久化到后端进度服务
        try {
          const numericLevel = (() => {
            const m = String(level.id).match(/(\d+)$/);
            return m ? parseInt(m[1], 10) : 1;
          })();

          await updateProgress({
            userId: useAuthStore.getState().user?.id,
            language: level.lang,
            game: level.gameType,
            level: numericLevel,
          });
        } catch (e) {
          console.warn('LEDRunner updateProgress failed:', e);
        }
        setShowReward(true);
      }

      // 自动开始播放（有事件时）
      const derivedEventsCandidate =
        Array.isArray(result.events) && result.events.length > 0
          ? result.events
          : parseLEDEvents(code);

      const gridWidth = (level as any).assets?.gridWidth || 8;
      const gridHeight = (level as any).assets?.gridHeight || 1;
      const staticEvents =
        derivedEventsCandidate.length > 0
          ? derivedEventsCandidate
          : convertFinalStateToEvents(result.finalState, gridWidth * gridHeight);
      setEvents(staticEvents);

      if (staticEvents.length > 0) {
        setCurrentTime(0);
        handlePlay();
      }
    } catch (error) {
      setResult({
        passed: false,
        message: '❌ 执行出错',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 播放控制（使用 requestAnimationFrame 做毫秒级时间轴）
  const animIdRef = (globalThis as any)._ledAnimIdRef || { current: 0 };
  (globalThis as any)._ledAnimIdRef = animIdRef;
  const startMsRef = (globalThis as any)._ledStartMsRef || { current: 0 };
  (globalThis as any)._ledStartMsRef = startMsRef;

  const handlePlay = () => {
    if (events.length === 0) return;
    const maxTick = Math.max(...events.map((e) => e.timestamp));
    const maxMs = maxTick * msPerTick;

    setIsPlaying(true);
    startMsRef.current = performance.now() - currentTime * msPerTick; // 继续播放时从当前进度

    const loop = () => {
      const elapsedMs = performance.now() - startMsRef.current;
      const nextTick = Math.min(maxTick, elapsedMs / msPerTick);
      setCurrentTime(nextTick);
      if (elapsedMs >= maxMs) {
        setIsPlaying(false);
        animIdRef.current && cancelAnimationFrame(animIdRef.current);
        return;
      }
      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current && cancelAnimationFrame(animIdRef.current);
    animIdRef.current = requestAnimationFrame(loop);
  };

  const handlePause = () => {
    if (!isPlaying) return;
    setIsPlaying(false);
    animIdRef.current && cancelAnimationFrame(animIdRef.current);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    animIdRef.current && cancelAnimationFrame(animIdRef.current);
  };

  const gridWidth = (level as any).assets?.gridWidth || 8;
  const gridHeight = (level as any).assets?.gridHeight || 1;
  const paletteEntries = Object.entries(LED_PALETTES) as Array<
    [LEDPaletteKey, (typeof LED_PALETTES)[LEDPaletteKey]]
  >;
  const hasVisual =
    events.length > 0 || Boolean(result?.finalState && /[01]/.test(result.finalState));
  const showPlaceholder = !hasVisual && !isRunning;
  const maxTick = events.length ? Math.max(...events.map((e) => e.timestamp)) : 0;
  const canResume = !isPlaying && currentTime > 0 && currentTime < maxTick;

  return (
    <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
      {/* 奖励弹层 */}
      {showReward && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 1000,
            textAlign: 'center',
            border: '3px solid gold',
          }}
        >
          <h2>🏆 通关奖励</h2>
          <div style={{ fontSize: '24px', margin: '20px 0' }}>🌟 3 星通关！</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '20px 0' }}>
            <div>
              <div style={{ fontSize: '20px' }}>💎</div>
              <div>+{level.rewards.xp} XP</div>
            </div>
            <div>
              <div style={{ fontSize: '20px' }}>🪙</div>
              <div>+{level.rewards.coins} 金币</div>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowReward(false)}
            style={{ minWidth: '120px' }}
          >
            继续挑战
          </Button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* 编辑区 */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <Card heading="📝 编程区">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label>LED 控制代码</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={10}
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                  }}
                  placeholder="在这里编写你的LED控制代码..."
                />
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: '#666',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '5px',
                }}
              >
                <strong>LED 控制语法：</strong>
                <br />• <code>on0</code> - 点亮 0 号灯
                <br />• <code>off0</code> - 熄灭 0 号灯
                <br />• 支持循环：<code>{'for i in range(5): print(f"on{i}")'}</code>
                <br />• 修饰语：<code>@ms</code> 时间偏移毫秒，<code>b=0.6</code> 亮度，
                <code>c=#ff8800</code> 颜色
                <br />• 例子：<code>print('on3@200 b=0.7 c=orange')</code> /{' '}
                <code>print('on1,2 b=0.8')</code>
                <br />• 时间语义：<code>sleep(ms)</code> 将时间轴前进 <code>ms</code> 毫秒；
                <code>time.sleep(s)</code> 前进 <code>s</code> 秒
                <br />• 累计生效：同一/多行的 <code>sleep</code> 均累加到后续{' '}
                <code>print('on/off')</code> 的时间偏移
                <br />• 例子：<code>sleep(200)</code> 后接 <code>print('on0')</code>；或{' '}
                <code>time.sleep(0.5)</code> 后接 <code>print('off0')</code>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '5px',
                }}
              >
                <label
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={useRemoteJudge}
                    onChange={(e) => setUseRemoteJudge(e.target.checked)}
                  />
                  <span style={{ fontSize: '12px' }}>使用远程判题</span>
                </label>
                <span style={{ fontSize: '10px', color: '#888' }}>
                  {useRemoteJudge ? '🌐 服务器判题' : '💻 本地判题'}
                </span>
              </div>

              <div>
                <Button
                  variant="primary"
                  onClick={handleRun}
                  disabled={isRunning}
                  style={{ minWidth: '120px' }}
                >
                  {isRunning ? '运行中...' : '▶ 运行代码'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* LED 显示器 */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <Card heading="💡 LED 灯阵">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <LEDVisualizer
                width={gridWidth}
                height={gridHeight}
                events={events}
                currentTime={currentTime}
                msPerTick={msPerTick}
                playing={isPlaying}
                finalState={result?.finalState}
                paletteKey={paletteKey}
              />

              {showPlaceholder && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(148, 163, 184, 0.08)',
                    border: '1px dashed rgba(148, 163, 184, 0.35)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    textAlign: 'center',
                  }}
                >
                  运行代码后，这里会实时呈现你的灯光秀 ✨
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>灯光主题</span>
                {paletteEntries.map(([key, palette]) => (
                  <Button
                    key={key}
                    variant={paletteKey === key ? 'primary' : 'ghost'}
                    onClick={() => setPaletteKey(key)}
                    style={{ minWidth: '72px' }}
                  >
                    {palette.label}
                  </Button>
                ))}
              </div>

              {events.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(() => {
                    const pct =
                      maxTick > 0
                        ? Math.min(100, Math.max(0, Math.round((currentTime / maxTick) * 100)))
                        : 0;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            background: '#e6e6e6',
                            borderRadius: '6px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{ width: `${pct}%`, height: '100%', background: '#4c9aff' }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#666',
                            minWidth: '40px',
                            textAlign: 'right',
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {(events.length > 0 || hasVisual) && (
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Button variant="secondary" onClick={handlePlay} style={{ minWidth: '80px' }}>
                    {canResume ? '▶ 继续' : '▶ 播放'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handlePause}
                    disabled={!isPlaying}
                    style={{ minWidth: '80px' }}
                  >
                    ⏸ 暂停
                  </Button>
                  <Button variant="ghost" onClick={handleReset} style={{ minWidth: '80px' }}>
                    🔄 重置
                  </Button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#777' }}>速度</span>
                    <Button
                      variant={msPerTick === 800 ? 'primary' : 'ghost'}
                      onClick={() => setMsPerTick(800)}
                      style={{ minWidth: '60px' }}
                    >
                      0.5x
                    </Button>
                    <Button
                      variant={msPerTick === 500 ? 'primary' : 'ghost'}
                      onClick={() => setMsPerTick(500)}
                      style={{ minWidth: '60px' }}
                    >
                      1x
                    </Button>
                    <Button
                      variant={msPerTick === 250 ? 'primary' : 'ghost'}
                      onClick={() => setMsPerTick(250)}
                      style={{ minWidth: '60px' }}
                    >
                      2x
                    </Button>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginLeft: '8px',
                      }}
                    >
                      <span style={{ fontSize: '12px', color: '#777' }}>BPM</span>
                      <input
                        type="number"
                        min={30}
                        max={300}
                        step={1}
                        value={Math.max(1, Math.round(60000 / Math.max(1, msPerTick)))}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!Number.isFinite(val) || val <= 0) return;
                          const nextMs = Math.round(60000 / val);
                          setMsPerTick(Math.max(1, nextMs));
                        }}
                        style={{ width: '70px', padding: '4px 6px', fontSize: '12px' }}
                      />
                      <span
                        style={{ fontSize: '11px', color: '#999' }}
                      >{`${msPerTick}ms/tick`}</span>
                    </div>
                  </div>
                </div>
              )}

              {result?.finalState && (
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.55)',
                    borderRadius: '10px',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#d9e3ff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ opacity: 0.7 }}>终局状态</span>
                  <code style={{ fontSize: '13px' }}>{result.finalState}</code>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 结果区 */}
      {result && (
        <Card heading="🏁 运行结果">
          <div
            style={{
              padding: '10px',
              borderRadius: '5px',
              backgroundColor: result.passed ? '#d4edda' : '#f8d7da',
              color: result.passed ? '#155724' : '#721c24',
              border: `1px solid ${result.passed ? '#c3e6cb' : '#f5c6cb'}`,
            }}
          >
            <strong>{result.message}</strong>
            {result.details && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '5px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  fontSize: '12px',
                }}
              >
                {result.details}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
