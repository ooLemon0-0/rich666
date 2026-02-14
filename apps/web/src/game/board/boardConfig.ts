import { BOARD_RICH666_V1 } from "@rich/game-config";

export type ZhouKey = "冀" | "兖" | "青" | "徐" | "豫" | "扬" | "荆" | "梁" | "雍";

interface BaseTile {
  id: string;
  nameZh: string;
}

export interface PropertyTile extends BaseTile {
  type: "property";
  zhouKey: ZhouKey;
  zhouName: string;
  tagIcon: string;
  setBonusRentMul: number;
  price: number;
  toll: number;
  buildCost: number;
  level: number;
}

export interface SpecialTile extends BaseTile {
  type: "special";
  icon: string;
}

export type BoardTileConfig = PropertyTile | SpecialTile;

const ZHOU_ABBR_TO_NAME: Record<ZhouKey, string> = {
  冀: "冀州",
  兖: "兖州",
  青: "青州",
  徐: "徐州",
  豫: "豫州",
  扬: "扬州",
  荆: "荆州",
  梁: "梁州",
  雍: "雍州"
};

const SPECIAL_ICON_BY_KEY: Record<string, string> = {
  start: "🏁",
  chance: "🎴",
  fate: "📜",
  tax: "💰",
  post: "🐎",
  chest: "🎁",
  jail: "⛓",
  go_to_jail: "🚨"
};

export const BOARD_CONFIG = BOARD_RICH666_V1;
export const BOARD_CORNERS = BOARD_CONFIG.corners;
export const BOARD_CORNER_INDEXES = [
  BOARD_CORNERS.topLeft,
  BOARD_CORNERS.topRight,
  BOARD_CORNERS.bottomRight,
  BOARD_CORNERS.bottomLeft
];

export const BOARD_TILES: BoardTileConfig[] = BOARD_CONFIG.tiles.map((tile) => {
  if (tile.type === "special") {
    return {
      id: `${tile.specialKey ?? "special"}-${tile.index}`,
      type: "special",
      nameZh: tile.name,
      icon: SPECIAL_ICON_BY_KEY[tile.specialKey ?? ""] ?? "✨"
    };
  }
  const zhouKey = (tile.zhouAbbr ?? "") as ZhouKey;
  const zhouName = tile.zhou ?? ZHOU_ABBR_TO_NAME[zhouKey] ?? "未知州";
  return {
    id: `${zhouName}-${tile.name}-${tile.index}`,
    type: "property",
    nameZh: tile.name,
    zhouKey,
    zhouName,
    tagIcon: zhouKey,
    setBonusRentMul: 1.5,
    price: tile.buyPrice ?? 0,
    toll: tile.rent ?? 0,
    buildCost: tile.upgradeCost ?? Math.max(120, Math.floor((tile.buyPrice ?? 0) * 0.72)),
    level: 0
  };
});

if (BOARD_TILES.length !== BOARD_CONFIG.totalTiles) {
  throw new Error(`board config invalid: total tiles ${BOARD_TILES.length} != ${BOARD_CONFIG.totalTiles}`);
}
