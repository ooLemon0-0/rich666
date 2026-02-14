import type { RoomId } from "@rich/shared";
import { BOARD_RICH666_V1 } from "@rich/game-config";

export type ServerTileKind = "special" | "property";

export interface ServerTileConfig {
  index: number;
  tileId: string;
  name: string;
  kind: ServerTileKind;
  price: number;
  rent: number;
}

export const TILES_CONFIG: ServerTileConfig[] = BOARD_RICH666_V1.tiles.map((tile) => ({
  index: tile.index,
  tileId: tile.type === "special" ? tile.specialKey ?? `special-${tile.index}` : `${tile.zhouAbbr ?? "city"}-${tile.name}`,
  name: tile.name,
  kind: tile.type,
  price: tile.type === "property" ? (tile.buyPrice ?? 0) : 0,
  rent: tile.type === "property" ? (tile.rent ?? 0) : 0
}));

if (TILES_CONFIG.length !== BOARD_RICH666_V1.totalTiles || TILES_CONFIG.some((tile, idx) => tile.index !== idx)) {
  throw new Error("tiles config invalid: index sequence mismatch");
}

export function getTileConfig(index: number): ServerTileConfig {
  return (
    TILES_CONFIG[index] ?? {
      index,
      tileId: `unknown-${index}`,
      name: `地块${index}`,
      kind: "special",
      price: 0,
      rent: 0
    }
  );
}

export function getTileDisplayName(_roomId: RoomId, index: number): string {
  return getTileConfig(index).name;
}
