import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { liveApiPlugin } from "./scripts/vite-live-api-plugin.mjs";

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), liveApiPlugin()],
});
