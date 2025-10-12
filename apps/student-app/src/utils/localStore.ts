const STORAGE_PREFIX = 'study-runner';

export type EditorMode = 'code' | 'blocks';

export interface CodeSnapshot {
  code: string;
  blockXml?: string | null;
  mode: EditorMode;
  timestamp: number;
}

function makeKey(language: string, game: string, level: number): string {
  return `${STORAGE_PREFIX}:${language}:${game}:${level}`;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function saveSnapshot(
  language: string,
  game: string,
  level: number,
  snapshot: CodeSnapshot,
): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(makeKey(language, game, level), JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Failed to persist code snapshot', error);
  }
}

export function loadSnapshot(language: string, game: string, level: number): CodeSnapshot | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(makeKey(language, game, level));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CodeSnapshot;
    if (!parsed || typeof parsed.code !== 'string') {
      return null;
    }
    return {
      code: parsed.code,
      blockXml: parsed.blockXml ?? null,
      mode: parsed.mode === 'blocks' ? 'blocks' : 'code',
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
    };
  } catch (error) {
    console.warn('Failed to load code snapshot', error);
    return null;
  }
}

export function clearSnapshot(language: string, game: string, level: number): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(makeKey(language, game, level));
  } catch (error) {
    console.warn('Failed to clear code snapshot', error);
  }
}
