import { Injectable } from '@nestjs/common';

type Key = string; // `${userId}:${language}:${game}`
type HintKey = string; // `${userId}:${language}:${game}:${level}`
type RecordItem = { level: number; passedAt: number; durationMs?: number };
type HintHistoryItem = { level: number; hintIndex: number; timestamp: number };
type HintUsage = { date: string; count: number; history: HintHistoryItem[] };

@Injectable()
export class ProgressService {
  private store = new Map<Key, RecordItem>();
  private hintUsage = new Map<HintKey, HintUsage>();
  private readonly hintDailyLimit = 3;

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

  getHintUsage(userId: string, language: string, game: string, level: number) {
    const key = this.hintKey(userId, language, game, level);
    const usage = this.ensureHintUsage(key);
    const today = this.today();
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
      usage.history = [];
    }
    return {
      date: usage.date,
      count: usage.count,
      limit: this.hintDailyLimit,
      history: [...usage.history],
    };
  }

  recordHintView(params: {
    userId: string;
    language: string;
    game: string;
    level: number;
    hintIndex: number;
  }) {
    const key = this.hintKey(params.userId, params.language, params.game, params.level);
    const usage = this.ensureHintUsage(key);
    const today = this.today();
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
      usage.history = [];
    }

    if (usage.count >= this.hintDailyLimit) {
      return {
        allowed: false,
        count: usage.count,
        limit: this.hintDailyLimit,
        date: usage.date,
      };
    }

    usage.count += 1;
    usage.history.push({
      level: params.level,
      hintIndex: params.hintIndex,
      timestamp: Date.now(),
    });

    return {
      allowed: true,
      count: usage.count,
      limit: this.hintDailyLimit,
      date: usage.date,
    };
  }

  private key(userId: string, language: string, game: string): Key {
    return `${userId}:${language}:${game}`;
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private ensureHintUsage(key: HintKey): HintUsage {
    if (!this.hintUsage.has(key)) {
      this.hintUsage.set(key, { date: this.today(), count: 0, history: [] });
    }
    return this.hintUsage.get(key)!;
  }

  private hintKey(userId: string, language: string, game: string, level: number): HintKey {
    return `${userId}:${language}:${game}:${level}`;
  }
}
