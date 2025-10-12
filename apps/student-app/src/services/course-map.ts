import { apiGet } from './api';
import type { CourseMapResponse } from '../models/course';

export async function fetchCourseMap(params: {
  language: string;
  game: string;
  userId?: string;
}): Promise<CourseMapResponse> {
  const search = new URLSearchParams();
  if (params.userId) {
    search.set('userId', params.userId);
  }
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return apiGet<CourseMapResponse>(`/api/course-map/${params.language}/${params.game}${suffix}`);
}
