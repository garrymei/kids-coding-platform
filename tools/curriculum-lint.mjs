#!/usr/bin/env node

/**
 * 课程数据静态检查工具
 * 扫描所有课程JSON文件，检查字段完整性和规范性
 * 
 * 使用方法：
 * node tools/curriculum-lint.mjs
 * node tools/curriculum-lint.mjs --fix
 * node tools/curriculum-lint.mjs --language python
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 配置
const CONFIG = {
  curriculumPath: path.join(projectRoot, 'server/api/src/data/curriculum'),
  reportPath: path.join(projectRoot, 'curriculum_report.json'),
};

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  language: args.find(arg => arg.startsWith('--language='))?.split('=')[1],
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose') || args.includes('-v'),
};

/**
 * 日志输出
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  console.log(`${prefix} ${message}`);
  if (data && options.verbose) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * 验证关卡数据结构
 */
function validateLevel(levelData, gameType, language) {
  const errors = [];
  const warnings = [];
  const fixes = [];
  
  const { level, title, judge, reference_solution } = levelData;
  
  // 必需字段检查
  if (!level && level !== 0) {
    errors.push('缺少 level 字段');
  }
  
  if (!title) {
    errors.push('缺少 title 字段');
  }
  
  // 判题配置检查
  if (!judge) {
    errors.push('缺少 judge 字段');
  } else {
    if (!judge.type) {
      errors.push('judge 缺少 type 字段');
    } else {
      // 根据判题类型检查特定字段
      switch (judge.type) {
        case 'stdout_compare':
          if (!judge.criteria) {
            errors.push('stdout_compare 类型缺少 criteria 字段');
          } else if (!judge.criteria.expected && !levelData.expected_io) {
            errors.push('stdout_compare 类型缺少 expected 字段');
            if (options.fix) {
              fixes.push({
                type: 'add_field',
                path: 'judge.criteria.expected',
                value: '',
                description: '添加空的 expected 字段'
              });
            }
          }
          break;
          
        case 'api_events':
          if (!judge.criteria) {
            warnings.push('api_events 类型建议配置 criteria.max_steps');
            if (options.fix) {
              fixes.push({
                type: 'add_field',
                path: 'judge.criteria',
                value: { max_steps: 50 },
                description: '添加默认的 max_steps 限制'
              });
            }
          }
          break;
          
        case 'svg_path_similarity':
          if (!judge.criteria || typeof judge.criteria.segments !== 'number') {
            errors.push('svg_path_similarity 类型缺少 criteria.segments 字段');
            if (options.fix) {
              fixes.push({
                type: 'add_field',
                path: 'judge.criteria.segments',
                value: 4,
                description: '添加默认的 segments 数量'
              });
            }
          }
          break;
          
        case 'unit_tests':
          // unit_tests 类型可以使用 judge.tests 或 judge.criteria.tests
          const hasTests = judge.tests || (judge.criteria && judge.criteria.tests);
          if (!hasTests) {
            errors.push('unit_tests 类型缺少 tests 数组（可以在 judge.tests 或 judge.criteria.tests 中）');
          } else if (judge.tests && !Array.isArray(judge.tests)) {
            errors.push('judge.tests 必须是数组');
          } else if (judge.criteria && judge.criteria.tests && !Array.isArray(judge.criteria.tests)) {
            errors.push('judge.criteria.tests 必须是数组');
          }
          break;
          
        default:
          warnings.push(`未知的判题类型: ${judge.type}`);
      }
    }
  }
  
  // 参考答案检查
  if (!reference_solution) {
    warnings.push('缺少 reference_solution 字段');
  } else if (reference_solution.trim().length === 0) {
    warnings.push('reference_solution 为空');
  }
  
  // 其他字段检查
  if (!levelData.objective && !levelData.description) {
    warnings.push('缺少 objective 或 description 字段');
  }
  
  if (!levelData.starter_code) {
    warnings.push('缺少 starter_code 字段');
  }
  
  // 游戏特定检查
  if (gameType === 'maze_navigator') {
    if (!levelData.maze_config && !levelData.grid) {
      warnings.push('迷宫游戏缺少 maze_config 或 grid 配置');
    }
  } else if (gameType === 'turtle_artist') {
    if (!levelData.canvas_config) {
      warnings.push('画图游戏缺少 canvas_config 配置');
    }
  }
  
  return { errors, warnings, fixes };
}

/**
 * 验证游戏文件
 */
async function validateGameFile(language, gameType) {
  const gameFile = path.join(CONFIG.curriculumPath, language, `${gameType}.json`);
  
  log('info', `检查游戏文件: ${language}/${gameType}.json`);
  
  try {
    const content = await fs.readFile(gameFile, 'utf-8');
    const gameData = JSON.parse(content);
    
    const result = {
      language,
      gameType,
      file: gameFile,
      levels: [],
      summary: {
        total: 0,
        errors: 0,
        warnings: 0,
        fixes: 0
      }
    };
    
    // 检查游戏级别字段
    if (!gameData.game_id) {
      result.gameErrors = ['缺少 game_id 字段'];
    }
    
    if (!gameData.language) {
      result.gameErrors = result.gameErrors || [];
      result.gameErrors.push('缺少 language 字段');
    }
    
    if (!Array.isArray(gameData.levels)) {
      result.gameErrors = result.gameErrors || [];
      result.gameErrors.push('levels 字段不是数组');
      return result;
    }
    
    // 检查每个关卡
    for (const levelData of gameData.levels) {
      const validation = validateLevel(levelData, gameType, language);
      
      result.levels.push({
        level: levelData.level,
        title: levelData.title,
        ...validation
      });
      
      result.summary.total++;
      if (validation.errors.length > 0) result.summary.errors++;
      if (validation.warnings.length > 0) result.summary.warnings++;
      if (validation.fixes.length > 0) result.summary.fixes++;
    }
    
    // 应用修复（如果启用）
    if (options.fix && result.levels.some(l => l.fixes.length > 0)) {
      await applyFixes(gameFile, gameData, result.levels);
    }
    
    return result;
  } catch (error) {
    log('error', `读取游戏文件失败: ${gameFile}`, error.message);
    return {
      language,
      gameType,
      file: gameFile,
      error: error.message
    };
  }
}

/**
 * 应用修复
 */
async function applyFixes(gameFile, gameData, levelResults) {
  log('info', `应用修复: ${gameFile}`);
  
  let modified = false;
  
  for (let i = 0; i < levelResults.length; i++) {
    const levelResult = levelResults[i];
    const levelData = gameData.levels[i];
    
    for (const fix of levelResult.fixes) {
      log('info', `应用修复: level ${levelData.level} - ${fix.description}`);
      
      // 根据路径设置值
      const pathParts = fix.path.split('.');
      let target = levelData;
      
      for (let j = 0; j < pathParts.length - 1; j++) {
        const part = pathParts[j];
        if (!target[part]) {
          target[part] = {};
        }
        target = target[part];
      }
      
      const lastPart = pathParts[pathParts.length - 1];
      target[lastPart] = fix.value;
      modified = true;
    }
  }
  
  if (modified) {
    const backupFile = `${gameFile}.backup.${Date.now()}`;
    await fs.copyFile(gameFile, backupFile);
    log('info', `创建备份文件: ${backupFile}`);
    
    await fs.writeFile(gameFile, JSON.stringify(gameData, null, 2));
    log('info', `已更新文件: ${gameFile}`);
  }
}

/**
 * 获取所有游戏文件
 */
async function getAllGameFiles() {
  const games = [];
  
  try {
    const languages = await fs.readdir(CONFIG.curriculumPath);
    
    for (const language of languages) {
      if (options.language && language !== options.language) {
        continue;
      }
      
      const languageDir = path.join(CONFIG.curriculumPath, language);
      const stat = await fs.stat(languageDir);
      
      if (stat.isDirectory()) {
        const gameFiles = await fs.readdir(languageDir);
        
        for (const gameFile of gameFiles) {
          if (gameFile.endsWith('.json')) {
            const gameType = path.basename(gameFile, '.json');
            games.push({ language, gameType });
          }
        }
      }
    }
  } catch (error) {
    log('error', '扫描课程目录失败', error.message);
  }
  
  return games;
}

/**
 * 生成报告
 */
async function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    options,
    summary: {
      totalGames: results.length,
      totalLevels: 0,
      totalErrors: 0,
      totalWarnings: 0,
      totalFixes: 0,
      gamesWithErrors: 0,
      gamesWithWarnings: 0
    },
    results
  };
  
  // 计算统计信息
  for (const result of results) {
    if (result.error) {
      report.summary.totalErrors++;
      continue;
    }
    
    if (result.gameErrors && result.gameErrors.length > 0) {
      report.summary.gamesWithErrors++;
    }
    
    report.summary.totalLevels += result.summary.total;
    report.summary.totalErrors += result.summary.errors;
    report.summary.totalWarnings += result.summary.warnings;
    report.summary.totalFixes += result.summary.fixes;
    
    if (result.summary.errors > 0) {
      report.summary.gamesWithErrors++;
    }
    
    if (result.summary.warnings > 0) {
      report.summary.gamesWithWarnings++;
    }
  }
  
  // 写入报告文件
  await fs.writeFile(CONFIG.reportPath, JSON.stringify(report, null, 2));
  log('info', `生成报告文件: ${CONFIG.reportPath}`);
  
  return report;
}

/**
 * 主函数
 */
async function main() {
  log('info', '开始课程数据静态检查');
  log('info', '配置信息', CONFIG);
  log('info', '选项', options);
  
  try {
    const games = await getAllGameFiles();
    log('info', `找到 ${games.length} 个游戏文件`);
    
    const results = [];
    
    for (const { language, gameType } of games) {
      const result = await validateGameFile(language, gameType);
      results.push(result);
    }
    
    // 生成报告
    const report = await generateReport(results);
    
    // 输出总结
    log('info', '='.repeat(50));
    log('info', '课程数据检查完成');
    log('info', `游戏文件: ${report.summary.totalGames}`);
    log('info', `关卡总数: ${report.summary.totalLevels}`);
    log('info', `❌ 错误: ${report.summary.totalErrors}`);
    log('info', `⚠️  警告: ${report.summary.totalWarnings}`);
    log('info', `🔧 修复: ${report.summary.totalFixes}`);
    
    // 详细错误信息
    if (report.summary.totalErrors > 0) {
      log('error', '发现以下错误:');
      for (const result of results) {
        if (result.error) {
          log('error', `${result.language}/${result.gameType}: ${result.error}`);
        } else if (result.gameErrors) {
          for (const error of result.gameErrors) {
            log('error', `${result.language}/${result.gameType}: ${error}`);
          }
        } else {
          for (const level of result.levels) {
            for (const error of level.errors) {
              log('error', `${result.language}/${result.gameType}/level-${level.level}: ${error}`);
            }
          }
        }
      }
    }
    
    // 如果有错误，退出码非零
    if (report.summary.totalErrors > 0) {
      log('error', '存在错误，构建应该被阻断');
      process.exit(1);
    } else {
      log('info', '所有检查通过！');
      process.exit(0);
    }
  } catch (error) {
    log('error', '检查过程异常', error.message);
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});