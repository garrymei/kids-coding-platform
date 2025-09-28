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
});
