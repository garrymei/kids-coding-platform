import { Injectable } from '@nestjs/common';

type Key = string; // `${userId}:${language}:${game}`
type RecordItem = { level: number; passedAt: number; durationMs?: number };

@Injectable()
export class ProgressService {
  private store = new Map<Key, RecordItem>();

  update(
    userId: string,
    language: string,
    game: string,
    level: number,
    payload: Partial<RecordItem>,
  ) {
    const key = `${userId}:${language}:${game}`;
    const cur = this.store.get(key);
    const item = { level, passedAt: Date.now(), ...cur, ...payload };
    this.store.set(key, item);
    return item;
  }

  get(userId: string, language: string, game: string) {
    return this.store.get(`${userId}:${language}:${game}`);
  }

  // 获取用户已完成的关卡列表
  getCompletedLevels(userId: string, language: string, game: string): number[] {
    const record = this.get(userId, language, game);
    if (!record) return [];
    // 简化实现：假设完成了 1 到 record.level 的所有关卡
    const levels: number[] = [];
    for (let i = 1; i <= record.level; i++) {
      levels.push(i);
    }
    return levels;
  }
}
