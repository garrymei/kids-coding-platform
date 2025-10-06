import { IOStrategy } from './io.strategy';
import { LEDStrategy } from './led.strategy';
import { EventSeqStrategy } from './event-seq.strategy';
import { PixelStrategy } from './pixel.strategy';
import { MusicStrategy } from './music.strategy';
/**
 * 判题策略工厂
 * 负责创建和管理各种判题策略
 */
export class StrategyFactory {
  static strategies = new Map();
  static {
    // 注册所有可用的策略
    this.registerStrategy(new IOStrategy());
    this.registerStrategy(new LEDStrategy());
    this.registerStrategy(new EventSeqStrategy());
    this.registerStrategy(new PixelStrategy());
    this.registerStrategy(new MusicStrategy());
  }
  /**
   * 注册策略
   */
  static registerStrategy(strategy) {
    this.strategies.set(strategy.name, strategy);
  }
  /**
   * 获取策略
   */
  static getStrategy(name) {
    return this.strategies.get(name) || null;
  }
  /**
   * 获取所有可用的策略名称
   */
  static getAvailableStrategies() {
    return Array.from(this.strategies.keys());
  }
  /**
   * 检查策略是否存在
   */
  static hasStrategy(name) {
    return this.strategies.has(name);
  }
  /**
   * 获取策略信息
   */
  static getStrategyInfo() {
    return Array.from(this.strategies.values()).map((strategy) => ({
      name: strategy.name,
      description: this.getStrategyDescription(strategy.name),
    }));
  }
  static getStrategyDescription(name) {
    const descriptions = {
      io: 'Input/Output comparison strategy - compares stdout with expected output',
      led: 'LED sequence comparison strategy - compares LED events with expected sequence',
      'event-seq': 'Event sequence comparison strategy - compares event sequences',
      pixel: 'Pixel matrix comparison strategy - compares pixel matrices with tolerance',
      music: 'Music sequence comparison strategy - compares musical notes and timing',
    };
    return descriptions[name] || 'Unknown strategy';
  }
}
