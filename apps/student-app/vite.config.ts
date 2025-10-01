import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@kids/config": path.resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "../../packages/config/src",
      ),
      "@kids/ui-kit": path.resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "../../packages/ui-kit/src",
      ),
      "@kids/judge-stub": path.resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "../../packages/judge-stub/src",
      ),
      "@kids/forms": path.resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "../../packages/forms/src",
      ),
      "@kids/blockly-extensions": path.resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "../../packages/blockly-extensions/src",
      ),
    },
  },
  optimizeDeps: {
    include: ["@kids/config", "@kids/ui-kit", "@kids/forms", "@kids/blockly-extensions", "@kids/judge-stub"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@kids/ui-kit"],
          "vendor-utils": ["ky", "zustand"],
          "games-maze": ["./src/games/maze/MazeRunner"],
          "games-led": ["./src/games/led/LEDRunner"],
          "games-io": ["./src/games/io/IORunner"],
          "pages-settings": ["./src/pages/SettingsPage"],
          "pages-works": ["./src/pages/Works/WorksPage"],
          "pages-leaderboard": ["./src/pages/Leaderboard/LeaderboardPage"],
        },
      },
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5174,
  },
  preview: {
    port: 4174,
  },
});
