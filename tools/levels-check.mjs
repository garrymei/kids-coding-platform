#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, status = 'info') {
  const color = status === 'success' ? colors.green : 
                status === 'error' ? colors.red : 
                status === 'warning' ? colors.yellow : colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

async function checkLevels() {
  const root = process.cwd();
  const dir = path.join(root, 'docs/levels');
  
  log(`${colors.bold}🔍 开始检查关卡一致性...${colors.reset}\n`);
  
  if (!await fs.access(dir).then(() => true).catch(() => false)) {
    log('❌ docs/levels 目录不存在', 'error');
    return false;
  }
  
  const ids = new Set();
  let ok = true;
  let totalLevels = 0;
  
  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'schema.json');
    
    if (jsonFiles.length === 0) {
      log('⚠️  没有找到 JSON 关卡文件', 'warning');
      return true;
    }
    
    for (const file of jsonFiles) {
      const filePath = path.join(dir, file);
      log(`📄 检查文件: ${file}`);
      
      try {
        const text = await fs.readFile(filePath, 'utf8');
        const levels = JSON.parse(text);
        
        // 支持单个对象和数组两种格式
        const levelsArray = Array.isArray(levels) ? levels : [levels];
        
        for (const level of levelsArray) {
          totalLevels++;
          
          // 检查必需字段
          if (!level.id) {
            log(`❌ 缺少 id: ${file}`, 'error');
            ok = false;
          } else if (ids.has(level.id)) {
            log(`❌ 重复 id: ${level.id} in ${file}`, 'error');
            ok = false;
          } else {
            ids.add(level.id);
          }
          
          if (!level.title) {
            log(`❌ 缺少 title: ${level.id || 'unknown'}`, 'error');
            ok = false;
          }
          
          // 检查 starter 格式（支持 code 或 blockly）
          if (!level?.starter?.code && !level?.starter?.blockly) {
            log(`❌ 缺少 starter.code 或 starter.blockly: ${level.id || 'unknown'}`, 'error');
            ok = false;
          }
          
          // 检查 judge/grader 格式
          if (!level?.judge?.strategy && !level?.judge?.mode && 
              !level?.grader?.mode && !level?.grader?.io) {
            log(`❌ 缺少 judge/grader 配置: ${level.id || 'unknown'}`, 'error');
            ok = false;
          }
          
          // 检查中文编码
          if (level.title && /[\u4e00-\u9fff]/.test(level.title)) {
            // 检查是否包含中文字符
            const hasValidChinese = /[\u4e00-\u9fff]/.test(level.title);
            if (!hasValidChinese) {
              log(`⚠️  标题可能编码异常: ${level.id}`, 'warning');
            }
          }
        }
        
        log(`✅ ${file} 检查完成 (${levelsArray.length} 个关卡)`);
        
      } catch (error) {
        if (error instanceof SyntaxError) {
          log(`❌ JSON 解析失败: ${file} - ${error.message}`, 'error');
        } else {
          log(`❌ 读取文件失败: ${file} - ${error.message}`, 'error');
        }
        ok = false;
      }
    }
    
  } catch (error) {
    log(`❌ 读取目录失败: ${error.message}`, 'error');
    return false;
  }
  
  // 输出总结
  console.log(`\n${colors.bold}📊 检查总结:${colors.reset}`);
  log(`总关卡数: ${totalLevels}`);
  log(`唯一 ID 数: ${ids.size}`);
  
  if (ok) {
    log(`\n✅ 关卡检查通过！合计 ${ids.size} 个关卡`, 'success');
  } else {
    log(`\n❌ 关卡检查失败，请修复上述问题`, 'error');
  }
  
  return ok;
}

// 运行检查
checkLevels().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(`❌ 检查过程出错: ${error.message}`, 'error');
  process.exit(1);
});
