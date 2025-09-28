import { Injectable } from '@nestjs/common';

/**
 * 指标数据缓存服务
 * 趋势结果缓存 5 分钟（Redis Key：met:trend:{student}:{hash}）
 */
@Injectable()
export class MetricsCacheService {
  private cache = new Map<string, { data: any; expires: number }>();

  /**
   * 生成缓存键
   */
  private generateCacheKey(type: 'trend' | 'compare', params: any): string {
    const hash = this.hashParams(params);
    return `met:${type}:${hash}`;
  }

  /**
   * 获取缓存数据
   */
  get<T>(type: 'trend' | 'compare', params: any): T | null {
    const key = this.generateCacheKey(type, params);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 设置缓存数据
   */
  set<T>(type: 'trend' | 'compare', params: any, data: T, ttlMinutes: number = 5): void {
    const key = this.generateCacheKey(type, params);
    const expires = Date.now() + ttlMinutes * 60 * 1000;
    
    this.cache.set(key, { data, expires });
  }

  /**
   * 清除缓存
   */
  clear(type?: 'trend' | 'compare'): void {
    if (type) {
      // 清除特定类型的缓存
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(`met:${type}:`));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      // 清除所有缓存
      this.cache.clear();
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 参数哈希函数
   */
  private hashParams(params: any): string {
    const str = JSON.stringify(params, Object.keys(params).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 获取缓存统计
   */
  getStats(): { totalKeys: number; expiredKeys: number; memoryUsage: number } {
    const now = Date.now();
    let expiredKeys = 0;
    let memoryUsage = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        expiredKeys++;
      }
      memoryUsage += key.length + JSON.stringify(value).length;
    }

    return {
      totalKeys: this.cache.size,
      expiredKeys,
      memoryUsage
    };
  }
}
