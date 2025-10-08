import { create } from 'zustand';

import {
  type CreativeProject,
  type CreativeProjectInput,
  type CreativeTheme,
  getCreativeProjectById,
  getCreativeThemes,
  listCreativeProjects,
  saveCreativeProject,
  recordCreativeRun,
  toggleCreativeFavorite,
  toggleCreativeLike,
} from '../services/creative.repo';

export interface CreativeState {
  themes: CreativeTheme[];
  projects: CreativeProject[];
  drafts: CreativeProject[];
  loading: boolean;
  initialized: boolean;
  load: (ownerId?: string) => Promise<void>;
  loadProject: (id: string) => Promise<CreativeProject | undefined>;
  saveProject: (input: CreativeProjectInput) => Promise<CreativeProject>;
  likeProject: (projectId: string) => Promise<void>;
  unlikeProject: (projectId: string) => Promise<void>;
  favoriteProject: (projectId: string) => Promise<void>;
  unfavoriteProject: (projectId: string) => Promise<void>;
  recordRun: (projectId: string) => Promise<void>;
  invalidate: () => Promise<void>;
}

async function fetchAll(ownerId?: string) {
  const [themes, published, drafts] = await Promise.all([
    getCreativeThemes(),
    listCreativeProjects({ status: 'published' }),
    ownerId ? listCreativeProjects({ status: undefined, ownerId }) : Promise.resolve([]),
  ]);
  return { themes, published, drafts };
}

export const useCreativeStore = create<CreativeState>((set, get) => ({
  themes: [],
  projects: [],
  drafts: [],
  loading: false,
  initialized: false,

  load: async (ownerId?: string) => {
    set({ loading: true });
    const { themes, published, drafts } = await fetchAll(ownerId);
    set({
      themes,
      projects: published,
      drafts,
      loading: false,
      initialized: true,
    });
  },

  loadProject: async (id: string) => {
    const cached = get().projects.find((item) => item.id === id) ?? get().drafts.find((item) => item.id === id);
    if (cached) {
      return cached;
    }
    const remote = await getCreativeProjectById(id);
    if (remote) {
      set((state) => ({
        projects:
          remote.status === 'published' && !state.projects.find((item) => item.id === remote.id)
            ? [...state.projects, remote]
            : state.projects,
        drafts:
          remote.status === 'draft' && !state.drafts.find((item) => item.id === remote.id)
            ? [...state.drafts, remote]
            : state.drafts,
      }));
    }
    return remote;
  },

  saveProject: async (input: CreativeProjectInput) => {
    const saved = await saveCreativeProject(input);
    set((state) => {
      const updateList = (list: CreativeProject[]) => {
        const index = list.findIndex((item) => item.id === saved.id);
        if (index >= 0) {
          const next = [...list];
          next[index] = saved;
          return next;
        }
        return [...list, saved];
      };

      const isPublished = saved.status === 'published';

      return {
        projects: isPublished ? updateList(state.projects) : state.projects.filter((item) => item.id !== saved.id),
        drafts: isPublished ? state.drafts.filter((item) => item.id !== saved.id) : updateList(state.drafts),
      };
    });
    return saved;
  },

  likeProject: async (projectId: string) => {
    await toggleCreativeLike(projectId, 1);
    set((state) => ({
      projects: state.projects.map((item) =>
        item.id === projectId ? { ...item, likes: item.likes + 1 } : item,
      ),
    }));
  },

  unlikeProject: async (projectId: string) => {
    await toggleCreativeLike(projectId, -1);
    set((state) => ({
      projects: state.projects.map((item) =>
        item.id === projectId ? { ...item, likes: Math.max(0, item.likes - 1) } : item,
      ),
    }));
  },

  favoriteProject: async (projectId: string) => {
    await toggleCreativeFavorite(projectId, 1);
    set((state) => ({
      projects: state.projects.map((item) =>
        item.id === projectId ? { ...item, favorites: item.favorites + 1 } : item,
      ),
    }));
  },

  unfavoriteProject: async (projectId: string) => {
    await toggleCreativeFavorite(projectId, -1);
    set((state) => ({
      projects: state.projects.map((item) =>
        item.id === projectId ? { ...item, favorites: Math.max(0, item.favorites - 1) } : item,
      ),
    }));
  },

  recordRun: async (projectId: string) => {
    await recordCreativeRun(projectId);
    set((state) => ({
      projects: state.projects.map((item) =>
        item.id === projectId ? { ...item, runs: item.runs + 1 } : item,
      ),
    }));
  },

  invalidate: async (ownerId?: string) => {
    const { themes, published, drafts } = await fetchAll(ownerId);
    set({
      themes,
      projects: published,
      drafts,
    });
  },
}));
