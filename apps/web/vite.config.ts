import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/socket.io": {
        target: process.env.VITE_DEV_SOCKET_TARGET ?? "http://127.0.0.1:3000",
        ws: true,
        changeOrigin: true
      }
    }
  }
});
