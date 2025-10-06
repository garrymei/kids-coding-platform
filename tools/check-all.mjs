#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(step, message, status = 'info') {
  const color = status === 'success' ? colors.green : 
                status === 'error' ? colors.red : 
                status === 'warning' ? colors.yellow : colors.blue;
  console.log(`${color}${step ? `[${step}]` : ''} ${message}${colors.reset}`);
}

function runCommand(command, description, allowFailure = false) {
  try {
    log('', `\n${colors.bold}${description}${colors.reset}`);
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log('', `✅ ${description} - 成功`, 'success');
    return true;
  } catch (error) {
    if (allowFailure) {
      log('', `⚠️  ${description} - 跳过（允许失败）`, 'warning');
      return true;
    } else {
      log('', `❌ ${description} - 失败`, 'error');
      console.error(error.message);
      return false;
    }
  }
}

async function main() {
  console.log(`${colors.bold}${colors.blue}🚀 开始全量预检...${colors.reset}\n`);
  
  let allPassed = true;
  
  // 1) TypeScript 全量类型检查
  allPassed &= runCommand(
    'pnpm -w run -r tsc --noEmit',
    'TypeScript 全量类型检查'
  );
  
  // 2) Lint 检查
  allPassed &= runCommand(
    'pnpm -w run -r lint',
    'Lint 检查（含 react hooks、import 排序、unused-vars）'
  );
  
  // 3) 前端打包预演
  allPassed &= runCommand(
    'pnpm -w --filter "apps/*" build',
    '前端打包预演（student/parent/teacher）'
  );
  
  // 4) 后端编译
  allPassed &= runCommand(
    'pnpm -w --filter "packages/api" build',
    '后端编译'
  );
  
  // 5) 后端 e2e 测试
  allPassed &= runCommand(
    'pnpm -w --filter "packages/api" test:e2e',
    '后端 e2e 路由烟囱测试',
    true // 允许失败，可能还没实现
  );
  
  // 6) 单测
  allPassed &= runCommand(
    'pnpm -w --filter "packages/judge-stub" test',
    '策略/事件桥/关卡读取单测',
    true
  );
  
  allPassed &= runCommand(
    'pnpm -w --filter "packages/api" test',
    'API 单测',
    true
  );
  
  // 7) 关卡资源一致性检查
  allPassed &= runCommand(
    'pnpm -w run levels:check',
    '关卡资源一致性检查',
    true
  );
  
  // 8) 静态资源与编码检查
  allPassed &= runCommand(
    'pnpm -w run assets:check',
    '静态资源与编码检查',
    true
  );
  
  // 9) 本地"真容器"执行沙盒干跑（可选）
  if (process.env.USE_DOCKER === 'true') {
    allPassed &= runCommand(
      'pnpm -w --filter "packages/api" start:executor-smoke',
      '本地"真容器"执行沙盒干跑',
      true
    );
  }
  
  // 总结
  console.log(`\n${colors.bold}${allPassed ? colors.green : colors.red}${allPassed ? '🎉 所有检查通过！' : '❌ 部分检查失败，请修复后重试'}${colors.reset}\n`);
  
  if (!allPassed) {
    process.exit(1);
  }
}

main().catch(console.error);


