import { runAndJudge } from '../lib/runAndJudge';
import { LevelScanner } from './levelScanner';

interface LevelInfo {
  id: string;
  path: string;
  category: string;
  gameType: string;
}

interface TestResult {
  levelId: string;
  passed: boolean;
  error?: string;
  details?: any;
  gameType: string;
  category: string;
}

/**
 * 全局游戏检验机制
 * 自动测试所有关卡，确保游戏逻辑正确性
 */
export class GlobalGameTester {
  private levels: LevelInfo[] = [];

  /**
   * 扫描所有关卡文件
   */
  async scanLevels(): Promise<LevelInfo[]> {
    try {
      const levelFiles = await LevelScanner.scanAllLevels();
      
      this.levels = levelFiles.map(file => ({
        id: file.id,
        path: file.path,
        category: file.category,
        gameType: file.gameType
      }));
      
      console.log(`扫描到 ${this.levels.length} 个关卡文件`);
      return this.levels;
    } catch (error) {
      console.error('扫描关卡文件失败:', error);
      return [];
    }
  }

  /**
   * 测试单个关卡
   */
  async testLevel(levelInfo: LevelInfo): Promise<TestResult> {
    try {
      // 加载关卡配置
      const response = await fetch(levelInfo.path);
      if (!response.ok) {
        throw new Error(`Failed to load level: ${response.statusText}`);
      }
      
      const levelConfig = await response.json();
      
      // 执行关卡的解决方案代码
      const result = await runAndJudge(
        levelConfig.solution || levelConfig.solutionCode,
        levelConfig.language || 'python',
        levelConfig.gameType || 'pixel',
        levelConfig.testCases || [],
        levelConfig.judgeMode || 'io'
      );
      
      // 检查结果
      const passed = result.success && result.artifacts?.judgeResult?.passed;
      
      return {
        levelId: levelInfo.id,
        passed: !!passed,
        error: passed ? undefined : result.error || 'Test failed',
        details: result,
        gameType: levelInfo.gameType,
        category: levelInfo.category
      };
    } catch (error) {
      return {
        levelId: levelInfo.id,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        gameType: levelInfo.gameType,
        category: levelInfo.category
      };
    }
  }

  /**
   * 测试所有关卡
   */
  async testAllLevels(): Promise<TestResult[]> {
    if (this.levels.length === 0) {
      await this.scanLevels();
    }
    
    const results: TestResult[] = [];
    
    for (const level of this.levels) {
      console.log(`Testing level: ${level.id}`);
      const result = await this.testLevel(level);
      results.push(result);
      
      // 添加延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * 生成测试报告
   */
  generateReport(results: TestResult[]): string {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;
    
    let report = `\n=== 全局游戏检验报告 ===\n`;
    report += `总关卡数: ${total}\n`;
    report += `通过: ${passed}\n`;
    report += `失败: ${failed}\n`;
    report += `成功率: ${((passed / total) * 100).toFixed(1)}%\n\n`;
    
    // 按游戏类型统计
    const byGameType = results.reduce((acc, result) => {
      if (!acc[result.gameType]) {
        acc[result.gameType] = { total: 0, passed: 0, failed: 0 };
      }
      acc[result.gameType].total++;
      if (result.passed) {
        acc[result.gameType].passed++;
      } else {
        acc[result.gameType].failed++;
      }
      return acc;
    }, {} as Record<string, { total: number; passed: number; failed: number }>);
    
    report += `按游戏类型统计:\n`;
    Object.entries(byGameType).forEach(([gameType, stats]) => {
      const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
      report += `- ${gameType}: ${stats.passed}/${stats.total} (${successRate}%)\n`;
    });
    report += `\n`;
    
    if (failed > 0) {
      report += `失败的关卡:\n`;
      results.filter(r => !r.passed).forEach(result => {
        report += `- ${result.levelId} (${result.gameType}/${result.category}): ${result.error}\n`;
      });
    }
    
    return report;
  }

  /**
   * 运行完整测试套件
   */
  async runFullTest(): Promise<void> {
    console.log('开始全局游戏检验...');
    
    const results = await this.testAllLevels();
    const report = this.generateReport(results);
    
    console.log(report);
    
    // 如果有失败的测试，抛出错误
    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      throw new Error(`${failedTests.length} 个关卡测试失败`);
    }
  }
}

// 导出单例实例
export const globalGameTester = new GlobalGameTester();