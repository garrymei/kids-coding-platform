export type JudgeType = 'api_events' | 'svg_path_similarity' | 'unit_tests';

export interface ApiEventsPayload {
  events: Array<{ type: string; value?: any }>;
  meta?: { steps?: number; reached?: boolean };
}

export interface SvgPathPayload {
  segments: Array<{ len: number; deg: number }>;
  bbox?: { w: number; h: number };
}

export interface UnitTestPayload {
  functionName: string; // e.g., 'solve'
  args: any[];
  expected: any;
}

export interface JudgeRequest {
  type: JudgeType;
  criteria?: Record<string, any>;
  payload: any;
}

export interface JudgeResponse {
  pass: boolean;
  message?: string;
  details?: any;
}
