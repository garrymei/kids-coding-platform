import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@kids/config': path.resolve(__dirname, '../../packages/config/src'),
      '@kids/ui-kit': path.resolve(__dirname, '../../packages/ui-kit/src'),
      '@kids/forms': path.resolve(__dirname, '../../packages/forms/src'),
      '@kids/blockly-extensions': path.resolve(__dirname, '../../packages/blockly-extensions/src'),
    },
  },
  optimizeDeps: {
    include: ['@kids/config', '@kids/ui-kit', '@kids/forms', '@kids/blockly-extensions'],
  },
})
