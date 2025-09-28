import { Injectable } from '@nestjs/common';
import { JudgeRequestDto, JudgeResult } from './dto/judge-request.dto';
import { judgeIO } from './strategies/io.strategy';
import { judgeEventSeq } from './strategies/event-seq.strategy';
import { judgeLEDStrategy } from './strategies/led.strategy';
import { EventBridgeService } from '../execute/event-bridge.service';
import { ExecutionEvent } from '../execute/eventParser';

type JudgeStrategy = 'stdout' | 'pixel' | 'music' | 'maze';

type JudgeEvaluationResult = { ok: boolean; details?: any };

@Injectable()
export class JudgeService {
  constructor(private readonly eventBridge: EventBridgeService) {}

  async judge(dto: JudgeRequestDto): Promise<JudgeResult> {
    let ok = false;
    let details: any = {};

    switch (dto.gameType) {
      case 'io': {
        const res = judgeIO(dto.expected.io, dto.actual);
        ok = res.ok;
        details = res;
        break;
      }
      case 'led': {
        // LED 专用判题策略
        const res = judgeLEDStrategy({
          code: dto.actual.code || '',
          grader: dto.expected,
          assets: dto.actual.assets
        });
        ok = res.ok;
        details = res;
        break;
      }
      case 'maze': {
        // 先支持最常见的事件序列判题
        const res = judgeEventSeq(dto.expected.events, dto.actual);
        ok = res.ok;
        details = res;
        break;
      }
      default: {
        // 其它类型先返回未实现
        return { ok: false, score: 0, stars: 0, details: { message: 'Not implemented' } };
      }
    }

    // 简化：ok=3星，否则1星；奖励可由关卡配置决定，这里只做占位
    const stars = ok ? 3 : 1;
    const score = stars;
    const rewards = ok ? { xp: 20, coins: 5, badges: [] } : { xp: 0, coins: 0 };

    return { ok, score, stars, details, rewards };
  }

  async evaluateStrategy(params: {
    strategy: JudgeStrategy;
    expected: any;
    output: { stdout: string; events: ExecutionEvent[] };
    args?: Record<string, unknown>;
  }): Promise<JudgeEvaluationResult> {
    const { strategy, expected, output } = params;

    switch (strategy) {
      case 'stdout': {
        if (expected && typeof expected === 'object' && Array.isArray(expected.cases)) {
          const res = judgeIO(expected, { stdout: output.stdout });
          return { ok: res.ok, details: res };
        }
        const expectedText = this.extractExpectedText(expected);
        const actual = output.stdout.trim();
        const ok = actual === expectedText.trim();
        return ok
          ? { ok: true }
          : { ok: false, details: { expected: expectedText, actual: output.stdout } };
      }
      case 'maze': {
        const expectedSeq = this.normalizeExpectedSequence(expected);
        const actualSeq = this.eventBridge.toJudgeSequence(output.events, 'maze');
        const res = judgeEventSeq({ expect: expectedSeq }, { events: actualSeq });
        return { ok: res.ok, details: { ...res, expected: expectedSeq, actual: actualSeq } };
      }
      case 'music': {
        const expectedSeq = this.normalizeExpectedSequence(expected);
        const actualSeq = this.eventBridge.toJudgeSequence(output.events, 'music');
        const ok = expectedSeq.length === actualSeq.length && expectedSeq.every((v, i) => v === actualSeq[i]);
        return ok
          ? { ok: true }
          : { ok: false, details: { expected: expectedSeq, actual: actualSeq } };
      }
      case 'pixel': {
        return { ok: false, details: { message: 'Pixel strategy not implemented yet' } };
      }
      default:
        return { ok: false, details: { message: `Unknown judge strategy: ${strategy}` } };
    }
  }

  private extractExpectedText(expected: any): string {
    if (Array.isArray(expected)) {
      return expected.map((item) => String(item)).join('\n');
    }
    if (expected && typeof expected === 'object') {
      if (typeof expected.stdout === 'string') return expected.stdout;
      if (Array.isArray(expected.stdout)) return expected.stdout.join('\n');
      if (typeof expected.expect === 'string') return expected.expect;
    }
    return typeof expected === 'string' ? expected : '';
  }

  private normalizeExpectedSequence(expected: any): string[] {
    if (!expected) return [];
    if (Array.isArray(expected)) {
      return expected.map((item) => String(item));
    }
    if (typeof expected === 'object') {
      if (Array.isArray(expected.events)) {
        return expected.events.map((item: unknown) => String(item));
      }
      if (Array.isArray(expected.expect)) {
        return expected.expect.map((item: unknown) => String(item));
      }
      if (Array.isArray(expected.sequence)) {
        return expected.sequence.map((item: unknown) => String(item));
      }
    }
    if (typeof expected === 'string') {
      return expected.split(/\r?\n/).filter(Boolean);
    }
    return [];
  }
}
