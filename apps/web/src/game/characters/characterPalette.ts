const DEFAULT_CHARACTER_COLOR = "#60A5FA";

export const CHARACTER_PALETTE: Record<string, string> = {
  caocao: "#EF4444",
  zhugeliang: "#10B981",
  liubei: "#22C55E",
  taishici: "#06B6D4",
  guanyu: "#F97316",
  zhangfei: "#A855F7",
  zhaoyun: "#3B82F6",
  diaochan: "#EC4899",
  lvbu: "#E11D48",
  machao: "#F59E0B",
  simayi: "#6366F1",
  wanglang: "#14B8A6",
  luxun: "#84CC16",
  hejin: "#F43F5E",
  jiangwei: "#8B5CF6",
  pangtong: "#0EA5E9"
};

export function getCharacterColor(characterId: string | null | undefined): string {
  if (!characterId) {
    return DEFAULT_CHARACTER_COLOR;
  }
  return CHARACTER_PALETTE[characterId] ?? DEFAULT_CHARACTER_COLOR;
}
