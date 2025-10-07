import { Injectable } from '@nestjs/common';
import { JudgeRequest, JudgeResponse } from '../../common/dto/judge.dto';

@Injectable()
export class JudgeService {
  async judge(req: JudgeRequest): Promise<JudgeResponse> {
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
        return { pass: false, message: 'Unknown judge type' };
    }
  }

  private async judgeApiEvents(req: JudgeRequest): Promise<JudgeResponse> {
    const { criteria = {}, payload } = req;
    const endOk = payload?.meta?.reached === true || payload?.meta?.end === 'REACHED';
    const maxSteps = criteria.max_steps;
    if (maxSteps != null && payload?.meta?.steps > maxSteps) {
      return {
        pass: false,
        message: `超过最大步数限制 ${maxSteps}`,
        details: { steps: payload?.meta?.steps, maxSteps },
      };
    }
    return {
      pass: !!endOk,
      message: endOk ? '成功到达终点！' : '未到达终点',
      details: { reached: endOk, steps: payload?.meta?.steps },
    };
  }

  private async judgeSvg(req: JudgeRequest): Promise<JudgeResponse> {
    const { criteria = {}, payload } = req;
    const expected = Number(criteria.segments ?? 0);
    const got = Number(payload?.segments?.length ?? 0);
    const ok = expected > 0 ? Math.abs(expected - got) <= 1 : false;
    return {
      pass: ok,
      message: ok ? '路径绘制正确！' : `路径段数不匹配（期望：${expected}，实际：${got}）`,
      details: { expectedSegments: expected, actualSegments: got },
    };
  }

  private async judgeUnit(req: JudgeRequest): Promise<JudgeResponse> {
    const { payload } = req;
    const { result, expected } = payload || {};
    const pass = JSON.stringify(result) === JSON.stringify(expected);
    return {
      pass,
      message: pass ? '结果正确！' : '结果与期望不一致',
      details: { result, expected },
    };
  }

  // 新增：标准输出比对判题
  private normalizeStdout(s: string): string {
    return (s ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+$/gm, '') // 去除行尾空格
      .replace(/\n+$/, '') // 去除尾部空行
      .trim();
  }

  private lines(s: string): string[] {
    return this.normalizeStdout(s).split('\n');
  }

  private async judgeStdout(req: JudgeRequest): Promise<JudgeResponse> {
    const { criteria = {}, payload = {} } = req;
    const mode = criteria.mode || 'exact'; // exact | lines | regex
    const expected = String(criteria.expected ?? payload.expected ?? '');
    const actual = String(payload.stdout ?? '');
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

    return {
      pass,
      message,
      details: { mode, expected, actual },
    };
  }
}
