import type { BoardTileConfig, PropertyTile, SpecialTile } from "../board/boardConfig";

function makeSpecial(index: number, nameZh: string, icon: string): SpecialTile {
  return {
    id: `fallback-special-${index}`,
    type: "special",
    nameZh,
    icon
  };
}

function makeProperty(index: number): PropertyTile {
  const price = 220 + index * 10;
  return {
    id: `fallback-property-${index}`,
    type: "property",
    nameZh: `地块${index}`,
    zhouKey: "豫",
    zhouName: "中原",
    tagIcon: "豫",
    setBonusRentMul: 1.2,
    price,
    toll: Math.max(40, Math.floor(price * 0.22)),
    buildCost: Math.max(120, Math.floor(price * 0.7)),
    level: 0
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
