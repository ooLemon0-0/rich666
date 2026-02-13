function normalizeNamespace(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export const GAME_CONFIG = {
  slug: import.meta.env.VITE_GAME_SLUG?.trim() || "game",
  title: import.meta.env.VITE_GAME_TITLE?.trim() || "Web Game",
  socketNamespace: normalizeNamespace(import.meta.env.VITE_SOCKET_NAMESPACE?.trim() || "/"),
  baseUrl: import.meta.env.BASE_URL
} as const;
