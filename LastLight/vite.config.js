import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: "0.0.0.0",
    // WSL projects on a Windows drive need polling to see source edits reliably.
    watch: { usePolling: true, interval: 600 },
  },
  build: {
    rollupOptions: { output: { manualChunks: { three: ["three"] } } },
    chunkSizeWarningLimit: 650,
  },
});
