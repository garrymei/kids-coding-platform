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

async function checkAssets() {
  log(`${colors.bold}🔍 开始检查静态资源与编码...${colors.reset}\n`);
  
  let ok = true;
  
  // 检查 HTML 文件的 charset
  const htmlFiles = [
    'apps/student-app/index.html',
    'apps/parent-app/index.html',
    'apps/teacher-app/index.html'
  ];
  
  for (const htmlFile of htmlFiles) {
    try {
      const content = await fs.readFile(htmlFile, 'utf8');
      if (!content.includes('charset="UTF-8"') && !content.includes("charset='UTF-8'") && 
          !content.includes('charset="utf-8"') && !content.includes("charset='utf-8'")) {
        log(`❌ ${htmlFile} 缺少 UTF-8 charset 声明`, 'error');
        ok = false;
      } else {
        log(`✅ ${htmlFile} charset 检查通过`);
      }
    } catch (error) {
      log(`❌ 无法读取 ${htmlFile}: ${error.message}`, 'error');
      ok = false;
    }
  }
  
  // 检查 Vite 配置的 base 设置
  const viteConfigs = [
    'apps/student-app/vite.config.ts',
    'apps/parent-app/vite.config.ts',
    'apps/teacher-app/vite.config.ts'
  ];
  
  for (const configFile of viteConfigs) {
    try {
      const content = await fs.readFile(configFile, 'utf8');
      if (!content.includes('base:') && !content.includes('base =')) {
        log(`⚠️  ${configFile} 缺少 base 配置，建议设置 base: '/'`, 'warning');
      } else {
        log(`✅ ${configFile} base 配置检查通过`);
      }
    } catch (error) {
      log(`❌ 无法读取 ${configFile}: ${error.message}`, 'error');
      ok = false;
    }
  }
  
  // 检查中文字体文件
  const fontDirs = [
    'apps/student-app/public/fonts',
    'apps/parent-app/public/fonts',
    'apps/teacher-app/public/fonts'
  ];
  
  for (const fontDir of fontDirs) {
    try {
      await fs.access(fontDir);
      const files = await fs.readdir(fontDir);
      const chineseFonts = files.filter(f => 
        f.includes('Noto') || f.includes('SourceHan') || f.includes('PingFang')
      );
      
      if (chineseFonts.length === 0) {
        log(`⚠️  ${fontDir} 没有中文字体文件`, 'warning');
      } else {
        log(`✅ ${fontDir} 找到中文字体: ${chineseFonts.join(', ')}`);
      }
    } catch (error) {
      // 字体目录不存在，不是错误
      log(`ℹ️  ${fontDir} 不存在，跳过字体检查`);
    }
  }
  
  // 检查环境变量文件
  const envFiles = [
    '.env',
    '.env.development',
    '.env.production'
  ];
  
  for (const envFile of envFiles) {
    try {
      const content = await fs.readFile(envFile, 'utf8');
      const lines = content.split('\n');
      const frontendVars = lines.filter(line => 
        line.trim().startsWith('VITE_') && !line.trim().startsWith('#')
      );
      
      if (frontendVars.length === 0) {
        log(`⚠️  ${envFile} 没有 VITE_ 开头的环境变量`, 'warning');
      } else {
        log(`✅ ${envFile} 找到 ${frontendVars.length} 个前端环境变量`);
      }
    } catch (error) {
      // 环境变量文件不存在，不是错误
      log(`ℹ️  ${envFile} 不存在，跳过环境变量检查`);
    }
  }
  
  // 检查 TypeScript 环境变量类型声明
  const envTypeFiles = [
    'apps/student-app/src/env.d.ts',
    'apps/parent-app/src/env.d.ts',
    'apps/teacher-app/src/env.d.ts'
  ];
  
  for (const typeFile of envTypeFiles) {
    try {
      const content = await fs.readFile(typeFile, 'utf8');
      if (!content.includes('ImportMetaEnv')) {
        log(`⚠️  ${typeFile} 缺少 ImportMetaEnv 类型声明`, 'warning');
      } else {
        log(`✅ ${typeFile} 环境变量类型声明检查通过`);
      }
    } catch (error) {
      log(`⚠️  ${typeFile} 不存在，建议添加环境变量类型声明`, 'warning');
    }
  }
  
  // 检查图片资源
  const imageDirs = [
    'apps/student-app/public/images',
    'apps/parent-app/public/images',
    'apps/teacher-app/public/images'
  ];
  
  for (const imageDir of imageDirs) {
    try {
      await fs.access(imageDir);
      const files = await fs.readdir(imageDir);
      const imageFiles = files.filter(f => 
        f.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)
      );
      
      if (imageFiles.length === 0) {
        log(`ℹ️  ${imageDir} 没有图片文件`);
      } else {
        log(`✅ ${imageDir} 找到 ${imageFiles.length} 个图片文件`);
      }
    } catch (error) {
      // 图片目录不存在，不是错误
      log(`ℹ️  ${imageDir} 不存在，跳过图片检查`);
    }
  }
  
  // 输出总结
  console.log(`\n${colors.bold}📊 静态资源检查总结:${colors.reset}`);
  
  if (ok) {
    log(`\n✅ 静态资源检查通过！`, 'success');
  } else {
    log(`\n❌ 静态资源检查发现问题，请修复上述问题`, 'error');
  }
  
  return ok;
}

// 运行检查
checkAssets().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(`❌ 检查过程出错: ${error.message}`, 'error');
  process.exit(1);
});
