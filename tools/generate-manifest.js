const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'apps', 'student-app', 'public', 'levels');

const games = [
  {
    key: 'pixel',
    name: '像素创作课',
    world: '像素画廊',
    summary: '通过 Python 控制像素，绘制属于你的图案。',
    unlock: { requires: ['python/io'], minLevel: 2 },
  },
  {
    key: 'music',
    name: '旋律工坊',
    world: '音乐森林',
    summary: '使用音符事件编排旋律与节奏。',
    unlock: { requires: ['python/pixel'], minLevel: 3 },
  },
  {
    key: 'maze',
    name: '迷宫挑战',
    world: '遗迹迷宫',
    summary: '编写算法引导机器人走出迷宫。',
    unlock: { requires: ['python/music'], minLevel: 4 },
  },
  {
    key: 'led',
    name: '灯阵控制课',
    world: '能源中枢',
    summary: '编排 LED 运行顺序，修复能源信号。',
    unlock: { requires: ['python/maze'], minLevel: 5 },
  },
  {
    key: 'io',
    name: '信号塔训练营',
    world: '灯塔信号站',
    summary: '掌握输入输出基础，处理各类数据。',
    unlock: { requires: [], minLevel: 1 },
  },
];

function collectGameLevels(game) {
  const dir = path.join(baseDir, 'python', game, 'levels');
  const files = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(full);
      }
    }
  }
  walk(dir);
  files.sort();
  return files.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw.replace(/^\uFEFF/, ''));
    return {
      id: data.id,
      title: data.title,
      lang: data.lang || 'python',
      gameType: data.gameType || game,
      difficulty: data.difficulty || 1,
      goals: data.goals || [],
      story: data.story || '',
      rewards: data.rewards || {},
      path: path.relative(baseDir, filePath).replace(/\\/g, '/'),
    };
  });
}

const levels = [];
const packs = [];
const gamesMeta = {};

for (const game of games) {
  const entries = collectGameLevels(game.key);
  if (entries.length !== 10) {
    console.warn(`Warning: game ${game.key} has ${entries.length} levels`);
  }
  levels.push(...entries);
  packs.push({
    lang: 'python',
    gameType: game.key,
    world: game.world,
    name: game.name,
    summary: game.summary,
    unlock: game.unlock,
    rewards: { badges: [], firstClearBonusXP: 50 },
    levelCount: entries.length,
  });
  gamesMeta[game.key] = {
    name: game.name,
    description: game.summary,
    levelCount: entries.length,
    icon: `${game.key}.png`,
    color: '#3b82f6',
  };
}

const manifest = {
  packs,
  games: gamesMeta,
  levels,
};

fs.writeFileSync(path.join(baseDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
