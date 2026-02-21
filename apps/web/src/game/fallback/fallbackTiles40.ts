import type { BoardTileConfig, PropertyTile, SpecialTile } from "../board/boardConfig";

function makeSpecial(index: number, nameZh: string, icon: string): SpecialTile {
  const ring = fallbackRingPoint(index, 40);
  return {
    index,
    id: `fallback-special-${index}`,
    type: "special",
    name: nameZh,
    nameZh,
    mapX: ring.x,
    mapY: ring.y,
    icon
  };
}

function makeProperty(index: number): PropertyTile {
  const price = 220 + index * 10;
  const baseRent = Math.max(40, Math.floor(price * 0.22));
  const ring = fallbackRingPoint(index, 40);
  return {
    index,
    id: `fallback-property-${index}`,
    type: "property",
    name: `地块${index}`,
    nameZh: `地块${index}`,
    mapX: ring.x,
    mapY: ring.y,
    zhouKey: "豫",
    zhouName: "中原",
    tagIcon: "豫",
    setBonusRentMul: 1.2,
    price,
    toll: baseRent,
    buildCost: Math.max(120, Math.floor(price * 0.55)),
    rentByLevel: [baseRent, Math.round(baseRent * 1.6), Math.round(baseRent * 2.3), Math.round(baseRent * 3.2)],
    level: 0
  };
}

function fallbackRingPoint(index: number, total: number): { x: number; y: number } {
  const t = total <= 1 ? 0 : index / total;
  const angle = Math.PI * 2 * t - Math.PI / 2;
  return {
    x: Math.round((50 + Math.cos(angle) * 42) * 1000) / 1000,
    y: Math.round((50 + Math.sin(angle) * 42) * 1000) / 1000
  };
}

export const FALLBACK_TILES_40: BoardTileConfig[] = Array.from({ length: 40 }, (_unused, index) => {
  const specialMap: Record<number, [string, string]> = {
    0: ["起点", "🏁"],
    4: ["机会", "🎴"],
    8: ["赋税", "💰"],
    13: ["驿站", "🐎"],
    17: ["命运", "📜"],
    21: ["宝箱", "🎁"],
    25: ["机会", "🎴"],
    29: ["牢狱", "⛓"],
    34: ["命运", "📜"],
    39: ["押往牢狱", "🚨"]
  };
  const special = specialMap[index];
  if (special) {
    return makeSpecial(index, special[0], special[1]);
  }
  return makeProperty(index);
});
