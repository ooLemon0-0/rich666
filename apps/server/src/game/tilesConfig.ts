import type { RoomId } from "@rich/shared";

export type ServerTileKind = "special" | "property";

export interface ServerTileConfig {
  index: number;
  tileId: string;
  name: string;
  kind: ServerTileKind;
  price: number;
  rent: number;
}

const SPECIAL_INDEXES = new Set([0, 4, 8, 13, 17, 21, 25, 29, 34, 39]);
const SPECIAL_NAMES = new Map<number, string>([
  [0, "起点"],
  [4, "机会"],
  [8, "赋税"],
  [13, "驿站"],
  [17, "命运"],
  [21, "宝箱"],
  [25, "机会"],
  [29, "牢狱"],
  [34, "命运"],
  [39, "押往牢狱"]
]);

export const TILES_CONFIG: ServerTileConfig[] = Array.from({ length: 40 }, (_unused, index) => {
  const isSpecial = SPECIAL_INDEXES.has(index);
  if (isSpecial) {
    return {
      index,
      tileId: `special-${index}`,
      name: SPECIAL_NAMES.get(index) ?? `特殊地块${index}`,
      kind: "special",
      price: 0,
      rent: 0
    };
  }
  const price = 220 + index * 18;
  return {
    index,
    tileId: `property-${index}`,
    name: `地契${index}`,
    kind: "property",
    price,
    rent: Math.max(40, Math.floor(price * 0.22))
  };
});

export function getTileConfig(index: number): ServerTileConfig {
  return TILES_CONFIG[index] ?? {
    index,
    tileId: `unknown-${index}`,
    name: `地块${index}`,
    kind: "special",
    price: 0,
    rent: 0
  };
}

export function getTileDisplayName(_roomId: RoomId, index: number): string {
  return getTileConfig(index).name;
}
