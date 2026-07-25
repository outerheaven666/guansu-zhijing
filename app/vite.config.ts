import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// 多页应用：门户 / 观俗 / 执镜
// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  server: {
    port: 7100,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        guansu: path.resolve(__dirname, "guansu/index.html"),
        zhijing: path.resolve(__dirname, "zhijing/index.html"),
        live: path.resolve(__dirname, "live/index.html"),
        dingju: path.resolve(__dirname, "dingju/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
