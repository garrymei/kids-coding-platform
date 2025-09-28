#!/usr/bin/env tsx

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { glob } from 'glob';

interface GamePack {
  lang: string;
  gameType: string;
  world: string;
  name: string;
  summary: string;
  unlock: {
    requires: string[];
    minLevel: number;
  };
  rewards: {
    badges: string[];
    firstClearBonusXP: number;
  };
}

interface Level {
  id: string;
  title: string;
  lang: string;
  gameType: string;
  difficulty: number;
  goals: string[];
  story?: string;
  starter?: {
    blockly?: string;
    code?: string;
  };
  grader: {
    mode: string;
    io?: {
      cases: Array<{ in: string; out: string }>;
      match: string;
    };
    constraints?: {
      maxTimeMs: number;
      maxMemMB: number;
      forbiddenImports: string[];
    };
  };
  rewards: {
    xp: number;
    coins: number;
    badges: string[];
  };
  hints?: string[];
}

interface LevelManifest {
  packs: Array<{ 
    lang: string;
    gameType: string;
    world: string;
    name: string;
    summary: string;
    unlock: GamePack['unlock'];
    rewards: GamePack['rewards'];
    levelCount: number;
  }>;
  levels: Array<{ 
    id: string;
    title: string;
    lang: string;
    gameType: string;
    difficulty: number;
    goals: string[];
    story?: string;
    rewards: Level['rewards'];
    path: string;
  }>;
}

async function buildLevelManifest() {
  console.log('🔍 扫描关卡文件...');
  
  const levelsDir = 'docs/levels';
  const publicDir = 'apps/student-app/public/levels';
  
  // 确保 public 目录存在
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }
  
  const manifest: LevelManifest = {
    packs: [],
    levels: []
  };
  
  // 扫描所有语言目录（排除 schemas）
  const langDirs = (await glob('docs/levels/*/')).filter(dir => !basename(dir.replace(/\\/g, '/')).includes('schemas'));
  
  console.log('找到语言目录:', langDirs.map(dir => basename(dir.replace(/\\/g, '/'))));
  
  for (const langDir of langDirs) {
    const lang = basename(langDir.replace(/\\/g, '/'));
    
    console.log(`📁 处理语言: ${lang}`);
    
    // 扫描游戏包
    const gameDirs = (await glob(`${langDir.replace(/\\/g, '/')}/*/`)).filter(dir => basename(dir.replace(/\\/g, '/')) !== 'schemas');
    console.log(`  🔍 找到游戏包目录:`, gameDirs.map(dir => basename(dir.replace(/\\/g, '/'))));
    
    for (const gameDir of gameDirs) {
      const gameType = basename(gameDir.replace(/\\/g, '/'));
      console.log(`  🎮 处理游戏: ${gameType}`);
      
      // 读取 pack.json
      const packPath = join(gameDir, 'pack.json');
      if (!existsSync(packPath)) {
        console.warn(`    ⚠️  跳过 ${gameType}: 缺少 pack.json`);
        continue;
      }
      
      const packData: GamePack = JSON.parse(readFileSync(packPath, 'utf-8'));
      
      // 扫描关卡文件 - 修复路径构造
      const cleanGameDir = gameDir.replace(/\\/g, '/').replace(/\/$/, ''); // 移除末尾斜杠
      const levelPattern = `${cleanGameDir}/levels/**/*.json`;
      console.log(`    📄 关卡文件路径模式: ${levelPattern}`);
      
      const levelFiles = await glob(levelPattern);
      console.log(`    📄 找到关卡文件数量: ${levelFiles.length}`);
      console.log(`    📄 找到关卡文件:`, levelFiles.map(file => basename(file)));
      
      const levels: Level[] = [];

      for (const levelFile of levelFiles) {
        try {
          const levelData: Level = JSON.parse(readFileSync(levelFile, 'utf-8'));
          levels.push(levelData);

          // 复制关卡文件到 public 目录并生成正确的 manifest 路径
          const normalizedPath = levelFile.replace(/\\/g, '/');
          const manifestPath = normalizedPath.replace(`${levelsDir}/`, '');
          const publicLevelPath = join(publicDir, manifestPath);
          const publicLevelDir = dirname(publicLevelPath);

          if (!existsSync(publicLevelDir)) {
            mkdirSync(publicLevelDir, { recursive: true });
          }

          copyFileSync(levelFile, publicLevelPath);

          // 添加关卡的核心信息到 manifest
          manifest.levels.push({
            id: levelData.id,
            title: levelData.title,
            lang: levelData.lang,
            gameType: levelData.gameType,
            difficulty: levelData.difficulty,
            goals: levelData.goals,
            story: levelData.story,
            rewards: levelData.rewards,
            path: manifestPath, // 使用正确的相对路径
          });
        } catch (error) {
          console.error(`    ⚠️  读取关卡文件失败 ${levelFile}:`, error.message);
        }
      }

      // 添加包信息到 manifest
      manifest.packs.push({
        ...packData,
        levelCount: levels.length,
      });
    }
  }
  
  // 写入 manifest.json
  const manifestPath = join(publicDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`✅ 生成完成!`);
  console.log(`📊 统计:`);
  console.log(`  - 游戏包: ${manifest.packs.length}`);
  console.log(`  - 关卡总数: ${manifest.levels.length}`);
  console.log(`  - 输出路径: ${manifestPath}`);
  
  // 按语言分组统计
  const langStats = manifest.levels.reduce((acc, level) => {
    acc[level.lang] = (acc[level.lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`  - 语言分布:`, langStats);
}

// 运行生成器
buildLevelManifest().catch(console.error);
