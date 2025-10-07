import { apiGet } from './api';

export interface Level {
  level: number;
  title: string;
  objective: string;
  starter_code: string;
  reference_solution: string;
  judge: any;
}

export async function fetchLevel(language: string, game: string, level: number) {
  return apiGet<Level>(`/api/curriculum/${language}/${game}/${level}`);
}

// 新增：单独获取参考答案（按需加载，避免全量下发）
export async function fetchReference(language: string, game: string, level: number) {
  return apiGet<{ reference_solution: string }>(
    `/api/curriculum/${language}/${game}/${level}/reference`,
  );
}
