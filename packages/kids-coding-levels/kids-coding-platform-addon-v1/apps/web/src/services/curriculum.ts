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
