export type JudgeType = 'api_events' | 'svg_path_similarity' | 'unit_tests' | 'stdout_compare';

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
  score?: number;
  message?: string;
  details?: any;
  stdout?: string;
  stderr?: string;
  timeMs?: number;
  xpAwarded?: number;
}
