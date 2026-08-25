import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 5275,
      strictPort: true,
      proxy: {
        "/_backend": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/_backend/, ""),
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      exclude: ["e2e/**", "node_modules/**", "dist/**"],
      coverage: {
        reporter: ["text", "html"],
      },
    },
  };
});
