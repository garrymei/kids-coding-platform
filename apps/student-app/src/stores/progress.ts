import { create } from 'zustand';
import ky from 'ky';

// --- Mocks and Types based on the new spec ---

// 1. Types
type LevelState = 'done' | 'in_progress' | 'locked';

interface HomeSnapshot {
  xp: number;
  streakDays: number;
  today: { studyMinutes: number; attempts: number; passes: number };
  packages: Array<{ pkgId: string; title: string; completed: number; total: number; percent: number }>;
  nextLesson?: { levelId: string; pkgId: string; title: string };
  recent: Array<{ levelId: string; passed: boolean; ts: string }>;
  achievements: Array<{ id: string; title: string; gainedAt: string }>;
}

interface PackageDetails {
  levels: Array<{ levelId: string; status: LevelState }>;
  completed: number;
  total: number;
  percent: number;
  ts: number; // Timestamp for cache invalidation
}

interface ProgressState {
  loading: boolean;
  snapshot?: HomeSnapshot;
  pkgCache: Record<string, PackageDetails>;
}

interface ProgressActions {
  fetchHome: (studentId: string) => Promise<void>;
  fetchPackage: (studentId: string, pkgId: string) => Promise<void>;
  applyAttempt: (payload: { levelId: string; passed: boolean }) => void;
}

// 2. XP Rules
const XPRules = {
  passLevel: 10,
  retryPass: 2,
};

// 3. Mock API Layer
const mockApi = {
  get: async (url: string) => {
    console.log(`[Mock API] GET ${url}`);
    if (url.endsWith('/home')) {
      return {
        xp: 320,
        streakDays: 5,
        today: { studyMinutes: 32, attempts: 4, passes: 2 },
        packages: [
          { pkgId: 'python-basics', title: 'Python 基础', completed: 8, total: 12, percent: 0.667 },
          { pkgId: 'maze', title: '迷宫算法', completed: 2, total: 6, percent: 0.333 },
        ],
        nextLesson: { levelId: 'loops-2', pkgId: 'python-basics', title: '循环练习2' },
        recent: [{ levelId: 'loops-1', passed: true, ts: new Date().toISOString() }],
        achievements: [{ id: 'streak-3', title: '连续学习3天', gainedAt: '2025-09-27' }],
      };
    }
    if (url.includes('/packages/')) {
      const pkgId = url.split('/').pop() || '';
      return {
        pkgId,
        levels: [
          { levelId: 'intro-1', status: 'done' },
          { levelId: 'loops-1', status: 'done' },
          { levelId: 'loops-2', status: 'in_progress' },
          { levelId: 'func-1', status: 'locked' },
        ],
        completed: 2,
        total: 12,
        percent: 0.167,
      };
    }
    return {};
  },
  post: async (url: string, payload: unknown) => {
    console.log(`[Mock API] POST ${url}`, payload);
    // Simulate a delay for async operation
    await new Promise(resolve => setTimeout(resolve, 500));
    return { accepted: 1 };
  },
};


// --- Zustand Store Implementation ---

export const useProgressStore = create<ProgressState & ProgressActions>((set, get) => ({
  loading: false,
  snapshot: undefined,
  pkgCache: {},

  fetchHome: async (studentId: string) => {
    set({ loading: true });
    const data = await mockApi.get(`/progress/students/${studentId}/home`);
    set({ snapshot: data as HomeSnapshot, loading: false });
  },

  fetchPackage: async (studentId: string, pkgId: string) => {
    const cache = get().pkgCache[pkgId];
    // Use cache if it's fresh (e.g., less than 30s old)
    if (cache && Date.now() - cache.ts < 30000) {
      return;
    }
    const data = await mockApi.get(`/progress/students/${studentId}/packages/${pkgId}`);
    set(state => ({
      pkgCache: {
        ...state.pkgCache,
        [pkgId]: { ...(data as any), ts: Date.now() },
      },
    }));
  },

  applyAttempt: ({ levelId, passed }) => {
    const studentId = 'stu_1'; // Mock studentId
    const { snapshot, pkgCache } = get();
    if (!snapshot) return;

    // 1. Optimistically update the homepage snapshot
    const newSnapshot = { ...snapshot };
    newSnapshot.today = { ...snapshot.today, attempts: snapshot.today.attempts + 1 };

    if (passed) {
      const isFirstPass = !Object.values(pkgCache)
        .flatMap(p => p.levels)
        .some(l => l.levelId === levelId && l.status === 'done');
      
      newSnapshot.today.passes += 1;
      newSnapshot.xp += isFirstPass ? XPRules.passLevel : XPRules.retryPass;
    }
    newSnapshot.recent = [{ levelId, passed, ts: new Date().toISOString() }, ...snapshot.recent].slice(0, 5);

    // 2. Optimistically update the package cache
    const newPkgCache = { ...pkgCache };
    Object.entries(newPkgCache).forEach(([pkgId, pkg]) => {
      const levelIndex = pkg.levels.findIndex(l => l.levelId === levelId);
      if (levelIndex !== -1) {
        const currentStatus = pkg.levels[levelIndex].status;
        const nextStatus: LevelState = passed ? 'done' : (currentStatus === 'locked' ? 'in_progress' : currentStatus);
        
        if (pkg.levels[levelIndex].status !== nextStatus) {
            pkg.levels[levelIndex] = { ...pkg.levels[levelIndex], status: nextStatus };
            
            // Recalculate completion
            const completedCount = pkg.levels.filter(l => l.status === 'done').length;
            pkg.completed = completedCount;
            pkg.percent = pkg.total > 0 ? completedCount / pkg.total : 0;

            // Update package progress in snapshot as well
            const pkgInSnapshot = newSnapshot.packages.find(p => p.pkgId === pkgId);
            if(pkgInSnapshot) {
                pkgInSnapshot.completed = completedCount;
                pkgInSnapshot.percent = pkg.percent;
            }
        }
      }
    });

    // 3. Set the new state
    set({ snapshot: newSnapshot, pkgCache: newPkgCache });

    // 4. Asynchronously report the event to the backend
    mockApi.post('/progress/events', {
      body: [{
        type: 'LEVEL_ATTEMPT',
        studentId,
        levelId,
        passed,
        ts: new Date().toISOString(),
      }],
    }).catch(() => {
      console.error("Failed to report event. In a real app, this would be added to a retry queue.");
    });
  },
}));