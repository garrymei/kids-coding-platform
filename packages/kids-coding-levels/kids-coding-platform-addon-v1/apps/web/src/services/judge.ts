import { apiPost } from './api';

export async function judge(payload: any) {
  return apiPost(`/api/judge`, payload);
}

export async function execute(payload: any) {
  return apiPost(`/api/execute`, payload);
}
