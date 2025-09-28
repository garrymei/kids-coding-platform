import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@kids/config': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        '../../packages/config/src',
      ),
      '@kids/ui-kit': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        '../../packages/ui-kit/src',
      ),
      '@kids/forms': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        '../../packages/forms/src',
      ),
      '@kids/blockly-extensions': path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        '../../packages/blockly-extensions/src',
      ),
    },
  },
  optimizeDeps: {
    include: ['@kids/config', '@kids/ui-kit', '@kids/forms', '@kids/blockly-extensions'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 第三方库分包
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@kids/ui-kit'],
          'vendor-utils': ['ky', 'zustand'],
          
          // 游戏组件分包
          'games-maze': ['./src/games/maze/MazeRunner'],
          'games-led': ['./src/games/led/LEDRunner'],
          'games-io': ['./src/games/io/IORunner'],
          
          // 页面分包
          'pages-settings': ['./src/pages/SettingsPage'],
          'pages-works': ['./src/pages/Works/WorksPage'],
          'pages-leaderboard': ['./src/pages/Leaderboard/LeaderboardPage'],
          
          // 图表组件分包
          'charts': ['./src/components/charts'],
        },
      },
    },
    // 启用代码压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
  },
  // 开发服务器配置
  server: {
    port: 5174,
    // 启用预构建优化
    force: true,
  },
  // 预览服务器配置
  preview: {
    port: 4174,
  },
});
