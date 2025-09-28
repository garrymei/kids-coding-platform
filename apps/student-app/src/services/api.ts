import { HomeSnapshot, LearnEvent, PackageProgress } from '../types/progress';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// 获取首页进度数据
export async function fetchHomeProgress(studentId: string): Promise<HomeSnapshot> {
  const response = await fetch(`${API_BASE_URL}/progress/students/${studentId}/home`);
  if (!response.ok) {
    throw new Error(`Failed to fetch home progress: ${response.statusText}`);
  }
  return await response.json();
}

// 获取课程包进度
export async function fetchPackageProgress(studentId: string, pkgId: string): Promise<PackageProgress> {
  const response = await fetch(`${API_BASE_URL}/progress/students/${studentId}/packages/${pkgId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch package progress: ${response.statusText}`);
  }
  return await response.json();
}

// 上报学习事件
export async function reportLearnEvents(events: LearnEvent[]): Promise<{ accepted: number }> {
  const response = await fetch(`${API_BASE_URL}/progress/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(events),
  });
  if (!response.ok) {
    throw new Error(`Failed to report learn events: ${response.statusText}`);
  }
  return await response.json();
}

// 获取学生作品
export async function fetchStudentWorks(studentId: string) {
  const response = await fetch(`${API_BASE_URL}/works/students/${studentId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch student works: ${response.statusText}`);
  }
  return await response.json();
}