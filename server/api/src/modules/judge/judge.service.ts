import { Injectable } from '@nestjs/common';
import { JudgeRequest, JudgeResponse } from '../../common/dto/judge.dto';

@Injectable()
export class JudgeService {
  async judge(req: JudgeRequest): Promise<JudgeResponse> {
    const startedAt = Date.now();

    try {
      const base = await this.dispatchJudge(req);
      const pass = !!base.pass;
      return {
        ...base,
        pass,
        score: base.score ?? (pass ? 100 : 0),
        xpAwarded: pass ? (base.xpAwarded ?? 10) : 0,
        timeMs: base.timeMs ?? Date.now() - startedAt,
      };
    } catch (error) {
      return {
        pass: false,
        score: 0,
        xpAwarded: 0,
        message: '判题失败，请稍后再试',
        details: {
          error: error instanceof Error ? error.message : String(error),
          type: req.type,
        },
        timeMs: Date.now() - startedAt,
      };
    }
  }

  private async dispatchJudge(req: JudgeRequest): Promise<JudgeResponse> {
    switch (req.type) {
      case 'api_events':
        return this.judgeApiEvents(req);
      case 'svg_path_similarity':
        return this.judgeSvg(req);
      case 'unit_tests':
        return this.judgeUnit(req);
      case 'stdout_compare':
        return this.judgeStdout(req);
      default:
        return {
          pass: false,
          message: 'Unknown judge type',
          details: { type: req.type },
        };
    }
  }

  private async judgeApiEvents(req: JudgeRequest): Promise<JudgeResponse> {
    const { criteria = {}, payload } = req;

    // ☆ 关键强约束：必须有事件数据
    if (!payload || !Array.isArray(payload.events)) {
      return {
        pass: false,
        message: '缺少事件数据',
        details: { error: 'payload.events is required and must be an array' },
      };
    }

    // ☆ 关键强约束：必须到达终点
    const endOk = payload?.meta?.reached === true || payload?.meta?.end === 'REACHED';
    if (!endOk) {
      return {
        pass: false,
        message: '未到达终点',
        details: { reached: false, steps: payload?.meta?.steps },
      };
    }

    // 检查步数限制
    const maxSteps = criteria.max_steps;
    if (maxSteps != null && payload?.meta?.steps > maxSteps) {
      return {
        pass: false,
        message: `超过最大步数限制 ${maxSteps}`,
        details: { steps: payload?.meta?.steps, maxSteps },
      };
    }

    const base: JudgeResponse = {
      pass: true,
      message: '成功到达终点！',
      details: { reached: true, steps: payload?.meta?.steps },
    };
    base.score = 100;
    base.stdout = payload.stdout;
    base.stderr = payload.stderr;
    return base;
  }

  private async judgeSvg(req: JudgeRequest): Promise<JudgeResponse> {
    const { criteria = {}, payload } = req;

    // ☆ 关键强约束：必须有绘图数据
    if (!Array.isArray(payload?.segments) || payload.segments.length === 0) {
      return {
        pass: false,
        message: '缺少绘图数据',
        details: { error: 'payload.segments is required and must be a non-empty array' },
      };
    }

    const expected = Number(criteria.segments ?? 0);
    const got = Number(payload.segments.length);
    const tolerance = criteria.segment_tolerance ?? 1;
    const diff = Math.abs(expected - got);
    const ok = expected > 0 ? diff <= tolerance : false;

    const response: JudgeResponse = {
      pass: ok,
      message: ok
        ? '路径绘制正确！'
        : `路径段数不匹配（期望：${expected}，实际：${got}，容差：${tolerance}）`,
      details: { expectedSegments: expected, actualSegments: got, tolerance, diff },
    };
    response.score = ok ? 100 : Math.max(0, 100 - diff * 10);
    response.stdout = payload.stdout;
    response.stderr = payload.stderr;
    return response;
  }

  private async judgeUnit(req: JudgeRequest): Promise<JudgeResponse> {
    const { payload } = req;

    // ☆ 关键强约束：必须有结果数据
    if (!payload || payload.result === undefined) {
      return {
        pass: false,
        message: '缺少执行结果',
        details: { error: 'payload.result is required' },
      };
    }

    const { result, expected } = payload;
    const pass = JSON.stringify(result) === JSON.stringify(expected);
    const response: JudgeResponse = {
      pass,
      message: pass ? '结果正确！' : '结果与期望不一致',
      details: { result, expected },
    };
    response.score = pass ? 100 : 0;
    response.stdout = payload.stdout;
    response.stderr = payload.stderr;
    return response;
  }

  // 标准输出比对判题
  private normalizeStdout(s: string): string {
    return (s ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, ''); // 去除行尾空格，但保留末尾换行符
  }

  private lines(s: string): string[] {
    return this.normalizeStdout(s).split('\n');
  }

  private async judgeStdout(req: JudgeRequest): Promise<JudgeResponse> {
    const { criteria = {}, payload = {} } = req;
    const mode = criteria.mode || 'exact'; // exact | lines | regex
    const expected = String(criteria.expected ?? payload.expected ?? '');
    const actual = String(payload.stdout ?? '');

    // ☆ 关键强约束：有期望输出但无实际输出 → 失败
    if (expected && !actual) {
      return {
        pass: false,
        message: '无输出',
        details: { mode, expected, actual: '', error: 'Expected output but got empty stdout' },
      };
    }

    // ☆ 关键强约束：无期望输出的情况下，不应该通过
    if (!expected) {
      return {
        pass: false,
        message: '缺少期望输出配置',
        details: { mode, expected: '', actual, error: 'criteria.expected is required' },
      };
    }

    let pass = false;
    let message = '';

    if (mode === 'regex') {
      const re = new RegExp(expected, 'm');
      pass = re.test(actual);
      message = pass ? '输出匹配正则表达式！' : '输出不匹配正则表达式';
    } else if (mode === 'lines') {
      // 行级比较（忽略行末空格、Windows/Unix换行差异）
      const actualLines = this.lines(actual);
      const expectedLines = this.lines(expected);
      pass =
        actualLines.length === expectedLines.length &&
        actualLines.every((x, i) => x === expectedLines[i]);
      message = pass
        ? '输出完全正确！'
        : `输出不匹配（期望 ${expectedLines.length} 行，实际 ${actualLines.length} 行）`;
    } else {
      // exact 模式
      pass = this.normalizeStdout(actual) === this.normalizeStdout(expected);
      message = pass ? '输出完全正确！' : '输出与期望不一致';
    }

    const response: JudgeResponse = {
      pass,
      message,
      details: { mode, expected, actual },
    };
    response.stdout = actual;
    response.stderr = payload.stderr;
    response.score = pass ? 100 : 0;
    return response;
  }
}
