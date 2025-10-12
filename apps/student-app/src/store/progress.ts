// Simple progress store using localStorage
export interface ProgressState {
  completedLevels: string[];
  xp: number;
  coins: number;
  // Track streak days
  lastActivityDate?: string; // YYYY-MM-DD format
  streakDays: number;
}

const STORAGE_KEY = 'student_progress';

class ProgressStore {
  private state: ProgressState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): ProgressState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      // console.warn('Failed to load progress from storage:', error);
    }

    // Default state
    return {
      completedLevels: [],
      xp: 0,
      coins: 0,
      streakDays: 0,
    };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      // console.warn('Failed to save progress to storage:', error);
    }
  }

  getProgress(): ProgressState {
    return { ...this.state };
  }

  isLevelCompleted(levelId: string): boolean {
    return this.state.completedLevels.includes(levelId);
  }

  completeLevel(levelId: string, xp: number, coins: number): void {
    if (!this.isLevelCompleted(levelId)) {
      this.state.completedLevels.push(levelId);
      this.state.xp += xp;
      this.state.coins += coins;

      // Update streak days
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      if (!this.state.lastActivityDate) {
        // First activity
        this.state.streakDays = 1;
      } else {
        const lastDate = new Date(this.state.lastActivityDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day
          this.state.streakDays += 1;
        } else if (diffDays > 1) {
          // Break in streak
          this.state.streakDays = 1;
        }
        // If diffDays is 0 (same day), we don't change the streak
      }

      this.state.lastActivityDate = today;
      this.saveToStorage();

      // 触发自定义事件，通知其他组件进度已更新
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('progress-updated', { detail: { levelId, xp, coins } }),
        );
      }
    }
  }

  resetProgress(): void {
    this.state = {
      completedLevels: [],
      xp: 0,
      coins: 0,
      streakDays: 0,
    };
    this.saveToStorage();
  }

  addXp(xp: number): void {
    if (xp <= 0) return;
    this.state.xp += xp;
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('progress-updated', { detail: { xpDelta: xp } }));
    }
  }
}

export const progressStore = new ProgressStore();
