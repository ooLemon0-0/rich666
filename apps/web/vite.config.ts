import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

function normalizeBasePath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "/";
  }
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const gameSlug = env.VITE_GAME_SLUG?.trim() || "game";
  const basePath = env.VITE_BASE_PATH?.trim() || `/games/${gameSlug}/`;

  return {
    base: normalizeBasePath(basePath),
    plugins: [vue()],
    server: {
      port: 5173
    }
  };
});
