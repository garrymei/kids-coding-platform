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
      default:
        return { pass: false, message: 'Unknown judge type' };
    }
  }

  private async judgeApiEvents(req: JudgeRequest): Promise<JudgeResponse> {
    const { criteria = {}, payload } = req;
    const endOk = payload?.meta?.reached === true || payload?.meta?.end === 'REACHED';
    const maxSteps = criteria.max_steps;
    if (maxSteps != null && payload?.meta?.steps > maxSteps) {
      return { pass: false, message: `Exceeded max steps ${maxSteps}` };
    }
    return { pass: !!endOk, details: { endOk, steps: payload?.meta?.steps } };
  }

  private async judgeSvg(req: JudgeRequest): Promise<JudgeResponse> {
    const { criteria = {}, payload } = req;
    const tol = typeof criteria.tolerance === 'number' ? criteria.tolerance : 0.2;
    // naive check: segment count approximately equals expected 'segments'
    if (criteria.segments && payload?.segments) {
      const diff = Math.abs(criteria.segments - payload.segments.length);
      const ok = diff <= 1;
      return {
        pass: ok,
        details: { expectedSegments: criteria.segments, got: payload.segments.length },
      };
    }
    return { pass: false, message: 'Invalid svg payload' };
  }

  private async judgeUnit(req: JudgeRequest): Promise<JudgeResponse> {
    const { payload } = req;
    // Here we assume the frontend already executed code and only submits result for comparison,
    // OR you can extend to run inside a sandbox and compare on server.
    const { result, expected } = payload || {};
    const pass = JSON.stringify(result) === JSON.stringify(expected);
    return { pass, details: { result, expected } };
  }
}
