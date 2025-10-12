import { apiGet, apiPost } from './api';

export interface UpdateProgressPayload {
  userId?: string;
  language: string;
  game: string;
  level: number;
  durationMs?: number;
}

export interface NextLevelResponse {
  nextLevel: number;
  finished: boolean;
  currentLevel: number;
}

export interface ProgressStatusResponse {
  currentLevel: number;
  completedLevels: number[];
  lastPassedAt?: number;
}

export interface HintUsageResponse {
  date: string;
  count: number;
  limit: number;
}

export interface HintRecordResponse {
  allowed: boolean;
  count: number;
  limit: number;
  date: string;
}

export async function updateProgress(payload: UpdateProgressPayload) {
  return apiPost('/api/progress/update', payload);
}

export async function getNextLevel(params: { userId?: string; language: string; game: string }) {
  const qs = new URLSearchParams({
    userId: params.userId ?? 'demo',
    language: params.language,
    game: params.game,
  });
  return apiGet<NextLevelResponse>(`/api/progress/next?${qs.toString()}`);
}

export async function getProgressStatus(params: {
  userId?: string;
  language: string;
  game: string;
}) {
  const qs = new URLSearchParams({
    userId: params.userId ?? 'demo',
    language: params.language,
    game: params.game,
  });
  return apiGet<ProgressStatusResponse>(`/api/progress/status?${qs.toString()}`);
}

export async function getHintUsage(params: {
  userId?: string;
  language: string;
  game: string;
  level: number;
}) {
  const qs = new URLSearchParams({
    userId: params.userId ?? 'demo',
    language: params.language,
    game: params.game,
    level: String(params.level),
  });
  return apiGet<HintUsageResponse>(`/api/progress/hints?${qs.toString()}`);
}

export async function recordHintView(payload: {
  userId?: string;
  language: string;
  game: string;
  level: number;
  hintIndex: number;
}) {
  return apiPost<HintRecordResponse>('/api/progress/hints', {
    userId: payload.userId ?? 'demo',
    language: payload.language,
    game: payload.game,
    level: payload.level,
    hintIndex: payload.hintIndex,
  });
}
