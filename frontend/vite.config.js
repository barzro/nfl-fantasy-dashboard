import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config with production React build
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false, // don't include eval()-style source maps
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  server: {
    port: 5173,
  },
});

