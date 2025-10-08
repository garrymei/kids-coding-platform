import type { Level } from '@kids/types';

export type CreativeVisibility = 'class' | 'school' | 'private';
export type CreativeStatus = 'draft' | 'published';

export interface CreativeTheme {
  id: string;
  title: string;
  summary: string;
  focus: 'music' | 'led' | 'pixel' | 'io';
  startAt: string;
  endAt: string;
  spotlight?: string;
}

export interface CreativeProject {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  summary: string;
  description: string;
  themeId?: string;
  status: CreativeStatus;
  visibility: CreativeVisibility;
  gameType: 'music' | 'led' | 'pixel' | 'io';
  code: string;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  favorites: number;
  runs: number;
}

export interface CreativeProjectInput {
  id?: string;
  title: string;
  summary: string;
  description: string;
  themeId?: string;
  visibility: CreativeVisibility;
  gameType: 'music' | 'led' | 'pixel' | 'io';
  code: string;
  coverUrl?: string;
  status: CreativeStatus;
  ownerId: string;
  ownerName: string;
}

export interface ListProjectsOptions {
  status?: CreativeStatus;
  ownerId?: string;
  limit?: number;
  themeId?: string;
}

const STORAGE_KEY = 'kc.creative.projects.v1';

const inMemoryStore: CreativeProject[] = [];

const defaultThemes: CreativeTheme[] = [
  {
    id: 'theme-001',
    title: '节奏唤醒',
    summary: '用音符和节奏唤醒沉睡的岛灵，创作属于你的节奏合成器。',
    focus: 'music',
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    spotlight: '尝试使用不同的节拍与循环，让旋律逐渐丰富。',
  },
  {
    id: 'theme-002',
    title: '光影信号',
    summary: '通过灯阵组合设计一套交流暗号，让小伙伴读懂你的消息。',
    focus: 'led',
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'theme-003',
    title: '像素物语',
    summary: '利用像素画还原一个童年的瞬间。',
    focus: 'pixel',
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const seedProjects: CreativeProject[] = [
  {
    id: 'project-demo-1',
    ownerId: 'student-demo',
    ownerName: 'Xiao Ming',
    title: '节奏合成器',
    summary: '使用循环和数组构建 4 小节节奏机器。',
    description:
      '我先定义了一个节奏模式数组，再通过 for 循环组合不同的鼓点，让音乐不断变化。',
    themeId: 'theme-001',
    status: 'published',
    visibility: 'school',
    gameType: 'music',
    code: "patterns = [['kick', 'snare'], ['kick', 'hat'], ['snare', 'hat']]\nfor bar in range(4):\n    for beat, sound in enumerate(patterns[bar % len(patterns)]):\n        print(f'note {beat} {sound} 1')",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    likes: 18,
    favorites: 6,
    runs: 42,
  },
  {
    id: 'project-demo-2',
    ownerId: 'student-demo',
    ownerName: 'Harper',
    title: '夜空灯阵',
    summary: '让灯阵慢慢亮起，仿佛流星穿过夜空。',
    description:
      '通过列表保存灯的顺序，每一步点亮一盏灯，营造出流动的效果。',
    themeId: 'theme-002',
    status: 'published',
    visibility: 'class',
    gameType: 'led',
    code: "for light in range(8):\n    print(f'on{light}')\n    print(f'off{light}')",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    likes: 9,
    favorites: 3,
    runs: 21,
  },
];

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

function loadProjectsFromStorage(): CreativeProject[] {
  const storage = getStorage();
  if (!storage) {
    if (inMemoryStore.length === 0) {
      inMemoryStore.push(...seedProjects);
    }
    return inMemoryStore;
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      storage.setItem(STORAGE_KEY, JSON.stringify(seedProjects));
      return [...seedProjects];
    }
    const parsed = JSON.parse(raw) as CreativeProject[];
    return parsed;
  } catch (error) {
    console.warn('读取创作项目失败，已重置为默认数据', error);
    storage.setItem(STORAGE_KEY, JSON.stringify(seedProjects));
    return [...seedProjects];
  }
}

function persistProjects(projects: CreativeProject[]) {
  const storage = getStorage();
  if (!storage) {
    inMemoryStore.splice(0, inMemoryStore.length, ...projects);
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function ensureId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `creative-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getCreativeThemes(): Promise<CreativeTheme[]> {
  return defaultThemes;
}

export async function listCreativeProjects(options: ListProjectsOptions = {}): Promise<CreativeProject[]> {
  const { status, ownerId, limit, themeId } = options;
  let projects = loadProjectsFromStorage();

  if (status) {
    projects = projects.filter((item) => item.status === status);
  }

  if (ownerId) {
    projects = projects.filter((item) => item.ownerId === ownerId);
  }

  if (themeId) {
    projects = projects.filter((item) => item.themeId === themeId);
  }

  projects = projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  if (limit && projects.length > limit) {
    return projects.slice(0, limit);
  }

  return projects;
}

export async function getCreativeProjectById(id: string): Promise<CreativeProject | undefined> {
  return loadProjectsFromStorage().find((item) => item.id === id);
}

export async function saveCreativeProject(input: CreativeProjectInput): Promise<CreativeProject> {
  const now = new Date().toISOString();
  const projects = loadProjectsFromStorage();

  if (input.id) {
    const index = projects.findIndex((item) => item.id === input.id);
    if (index >= 0) {
      const updated: CreativeProject = {
        ...projects[index],
        ...input,
        updatedAt: now,
      };
      projects[index] = updated;
      persistProjects(projects);
      return updated;
    }
  }

  const created: CreativeProject = {
    id: ensureId(),
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    title: input.title,
    summary: input.summary,
    description: input.description,
    themeId: input.themeId,
    status: input.status,
    visibility: input.visibility,
    gameType: input.gameType,
    code: input.code,
    coverUrl: input.coverUrl,
    createdAt: now,
    updatedAt: now,
    likes: 0,
    favorites: 0,
    runs: 0,
  };
  projects.push(created);
  persistProjects(projects);
  return created;
}

export async function recordCreativeRun(projectId: string): Promise<void> {
  const projects = loadProjectsFromStorage();
  const index = projects.findIndex((item) => item.id === projectId);
  if (index >= 0) {
    projects[index] = { ...projects[index], runs: projects[index].runs + 1 };
    persistProjects(projects);
  }
}

export async function toggleCreativeLike(projectId: string, delta: 1 | -1 = 1): Promise<void> {
  const projects = loadProjectsFromStorage();
  const index = projects.findIndex((item) => item.id === projectId);
  if (index >= 0) {
    const nextLikes = Math.max(0, projects[index].likes + delta);
    projects[index] = { ...projects[index], likes: nextLikes };
    persistProjects(projects);
  }
}

export async function toggleCreativeFavorite(projectId: string, delta: 1 | -1 = 1): Promise<void> {
  const projects = loadProjectsFromStorage();
  const index = projects.findIndex((item) => item.id === projectId);
  if (index >= 0) {
    const next = Math.max(0, projects[index].favorites + delta);
    projects[index] = { ...projects[index], favorites: next };
    persistProjects(projects);
  }
}

export function createCreativeLevel(gameType: CreativeProject['gameType']): Level {
  const base: Partial<Level> = {
    id: `creative-${gameType}`,
    title: `创作预览：${gameType.toUpperCase()}`,
    lang: 'python',
    gameType,
  };

  return base as Level;
}
