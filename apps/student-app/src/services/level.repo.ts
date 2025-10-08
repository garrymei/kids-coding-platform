import type { GamePack, Level, LevelManifest } from '@kids/types';

class LevelRepository {
  private manifest: LevelManifest | null = null;
  private levelCache = new Map<string, Level>();

  async loadManifest(): Promise<void> {
    try {
      const response = await fetch('/levels/manifest.json');
      this.manifest = await response.json();
    } catch (error) {
      // console.error('Failed to load level manifest:', error);
      throw new Error('Failed to load level manifest');
    }
  }

  async getPacks(lang: string): Promise<GamePack[]> {
    if (!this.manifest) {
      await this.loadManifest();
    }

    return this.manifest!.packs.filter((pack) => pack.lang === lang);
  }

  async getLevels(lang: string, gameType: string): Promise<Level[]> {
    if (!this.manifest) {
      await this.loadManifest();
    }

    return this.manifest!.levels.filter(
      (level) => level.lang === lang && level.gameType === gameType,
    );
  }

  async getLevelById(id: string): Promise<Level | undefined> {
    if (!this.manifest) {
      await this.loadManifest();
    }

    if (this.levelCache.has(id)) {
      return this.levelCache.get(id);
    }

    const entry = this.manifest!.levels.find((level) => level.id === id);
    if (!entry) {
      return undefined;
    }

    const detailPath = (entry as unknown as { path?: string }).path;

    if (!detailPath) {
      this.levelCache.set(id, entry as unknown as Level);
      return entry as unknown as Level;
    }

    try {
      const response = await fetch(`/levels/${detailPath}`);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const detail = (await response.json()) as Level;
      const merged = { ...entry, ...detail };
      this.levelCache.set(id, merged);
      return merged;
    } catch (error) {
      // console.error('Failed to load level detail:', error);
      this.levelCache.set(id, entry as unknown as Level);
      return entry as unknown as Level;
    }
  }

  async getPackByGameType(lang: string, gameType: string): Promise<GamePack | undefined> {
    if (!this.manifest) {
      await this.loadManifest();
    }

    return this.manifest!.packs.find((pack) => pack.lang === lang && pack.gameType === gameType);
  }
}

export const levelRepo = new LevelRepository();
export type { Level, GamePack };

// 新增：轻量级关卡索引和地图服务
export type LevelLite = {
  id: string;
  title: string;
  type: 'pixel' | 'maze' | 'io' | 'music' | 'led';
  pack: string;
  prereq: string[] | undefined;
  solution: string | undefined; // 参考答案代码
};

export type CourseMap = {
  nodes: Array<{
    id: string;
    title: string;
    summary: string;
    group: string;
    status: 'ready' | 'locked' | 'completed';
  }>;
  edges: Array<{ from: string; to: string }>;
};

export async function getAllLevels(): Promise<LevelLite[]> {
  const res = await fetch('/assets/levels/index.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('加载关卡索引失败');
  const list = (await res.json()) as LevelLite[];
  return list.map((l) => ({ ...l, id: l.id.toLowerCase() })); // 一律小写
}

export async function getLevelLiteById(id: string): Promise<LevelLite | undefined> {
  const all = await getAllLevels();
  return all.find((l) => l.id === id.toLowerCase());
}

export async function getCourseMap(): Promise<CourseMap> {
  const res = await fetch('/assets/levels/map.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('加载课程地图失败');
  const data = (await res.json()) as CourseMap;
  // 兼容大小写
  return {
    nodes: data.nodes.map((n) => ({ ...n, id: n.id.toLowerCase() })),
    edges: data.edges.map((e) => ({ from: e.from.toLowerCase(), to: e.to.toLowerCase() })),
  };
}

/** 选择"下一关"：优先找未完成的第一关 */
export async function pickNextLevel(doneIds: string[] = []): Promise<LevelLite | null> {
  const all = await getAllLevels();
  const done = new Set(doneIds.map((x) => x.toLowerCase()));
  for (const lv of all) {
    const pre = (lv.prereq ?? []).map((x) => x.toLowerCase());
    const preOk = pre.every((p) => done.has(p));
    if (!done.has(lv.id) && preOk) return lv;
  }
  // 都完成：回到最后一关
  return all[all.length - 1] ?? null;
}

export async function pickNextLevelInSameGame(
  currentLevel: Level,
  doneIds: string[] = [],
): Promise<Level | null> {
  const lang = (currentLevel as any).lang ?? 'python';
  const gameType = (currentLevel as any).gameType;

  if (!gameType) {
    return null;
  }

  const siblings = [...(await levelRepo.getLevels(lang, gameType))].sort(
    (a, b) => {
      const orderDiff = getLevelOrderValue(a) - getLevelOrderValue(b);
      if (orderDiff !== 0 && Number.isFinite(orderDiff)) {
        return orderDiff;
      }
      const idA = ((a as any).id ?? '') as string;
      const idB = ((b as any).id ?? '') as string;
      return idA.localeCompare(idB);
    },
  );
  const currentId = ((currentLevel as any).id ?? '').toLowerCase();
  const doneSet = new Set(doneIds.map((id) => id.toLowerCase()));

  const findNext = (start: number): Level | null => {
    for (let i = start; i < siblings.length; i += 1) {
      const candidate = siblings[i];
      const candidateId = (candidate as any).id?.toLowerCase?.();
      if (!candidateId || candidateId === currentId || doneSet.has(candidateId)) {
        continue;
      }
      const prerequisites: string[] = ((candidate as any).prereq || []).map((p: string) =>
        p.toLowerCase(),
      );
      const prereqOk = prerequisites.every((p) => doneSet.has(p) || p === currentId);
      if (!prereqOk) {
        continue;
      }
      return candidate;
    }
    return null;
  };

  const currentIndex = siblings.findIndex(
    (item) => (item as any).id?.toLowerCase?.() === currentId,
  );
  if (currentIndex >= 0) {
    const afterCurrent = findNext(currentIndex + 1);
    if (afterCurrent) {
      return afterCurrent;
    }
  }

  return findNext(0);
}

function getLevelOrderValue(level: Level): number {
  const numericLevel = (level as any).level;
  if (typeof numericLevel === 'number') {
    return numericLevel;
  }
  if (typeof numericLevel === 'string' && numericLevel.trim().length > 0) {
    const parsed = Number(numericLevel);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const id = ((level as any).id ?? '') as string;
  const match = id.match(/(\d+)(?!.*\d)/);
  if (match) {
    return Number(match[1]);
  }

  return Number.MAX_SAFE_INTEGER;
}
