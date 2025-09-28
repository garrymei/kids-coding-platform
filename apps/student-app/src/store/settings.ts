// 设置存储，使用 localStorage
export interface Settings {
  sfxEnabled: boolean;       // 默认 true
  colorWeakMode: boolean;    // 默认 false
  reduceMotion: boolean;     // 默认 false
  updatedAt: string;
}

const STORAGE_KEY = 'kcp.settings.v1';

class SettingsStore {
  private state: Settings;
  private listeners: Array<(settings: Settings) => void> = [];

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): Settings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load settings from storage:', error);
    }
    
    // 默认设置
    return {
      sfxEnabled: true,
      colorWeakMode: false,
      reduceMotion: false,
      updatedAt: new Date().toISOString(),
    };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save settings to storage:', error);
    }
  }

  getSettings(): Settings {
    return { ...this.state };
  }

  updateSettings(updates: Partial<Settings>): void {
    this.state = { 
      ...this.state, 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToStorage();
    
    // 应用设置到页面
    this.applySettings();
    
    // 广播设置变更事件
    this.broadcastSettingsChange();
  }

  private broadcastSettingsChange(): void {
    // 触发全局事件
    window.dispatchEvent(new CustomEvent('settingsChanged', { 
      detail: this.getSettings()
    }));
    
    // 通知所有订阅者
    this.listeners.forEach(listener => listener(this.getSettings()));
  }

  subscribe(listener: (settings: Settings) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private applySettings(): void {
    // 应用音效设置
    this.applySoundSettings();
    
    // 应用色弱模式
    this.applyColorWeakMode();
    
    // 应用动效减弱
    this.applyReduceMotion();
  }

  private applySoundSettings(): void {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.muted = !this.state.sfxEnabled;
    });
  }

  private applyColorWeakMode(): void {
    const body = document.body;
    if (this.state.colorWeakMode) {
      body.classList.add('color-weak-mode');
    } else {
      body.classList.remove('color-weak-mode');
    }
  }

  private applyReduceMotion(): void {
    const body = document.body;
    if (this.state.reduceMotion) {
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('reduce-motion');
    }
    
    // Apply CSS prefers-reduced-motion as fallback
    if (this.state.reduceMotion) {
      const style = document.createElement('style');
      style.id = 'reduce-motion-styles';
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      const existingStyle = document.getElementById('reduce-motion-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }

  // 初始化时应用设置
  initialize(): void {
    this.applySettings();
  }
}

export const settingsStore = new SettingsStore();

// 页面加载时初始化设置
if (typeof window !== 'undefined') {
  settingsStore.initialize();
  
  // Listen for changes from other tabs
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const newSettings = JSON.parse(event.newValue);
        settingsStore.updateSettings(newSettings);
      } catch (e) {
        console.warn('Failed to parse settings from storage event:', e);
      }
    }
  });
}