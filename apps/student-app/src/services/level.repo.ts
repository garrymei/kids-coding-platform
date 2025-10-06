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
