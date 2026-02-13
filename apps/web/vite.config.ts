import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  let base = "/";
  if (mode === "production") {
    const slug = (env.VITE_GAME_SLUG || "").trim();
    if (!slug) {
      throw new Error("VITE_GAME_SLUG is required in production mode");
    }
    base = `/games/${slug}/`;
  }

  return {
    base,
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
  };
});
