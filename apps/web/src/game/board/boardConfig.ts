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

function property(
  id: string,
  nameZh: string,
  zhouKey: ZhouKey,
  zhouName: string,
  zhouIndex: number,
  laneIndex: number
): PropertyTile {
  const basePrice = 220 + zhouIndex * 55 + laneIndex * 35;
  const toll = Math.max(40, Math.floor(basePrice * 0.22));
  const buildCost = Math.floor(basePrice * 0.75);
  return {
    id,
    type: "property",
    nameZh,
    zhouKey,
    zhouName,
    tagIcon: zhouKey,
    setBonusRentMul: 1.5,
    price: basePrice,
    toll,
    buildCost,
    level: 0
  };
}

function special(id: string, nameZh: string, icon: string): SpecialTile {
  return {
    id,
    type: "special",
    nameZh,
    icon
  };
}

const ZHOU_ORDER: ZhouKey[] = ["雍", "梁", "荆", "扬", "徐", "青", "兖", "冀", "豫"];

const propertyByZhou: Record<ZhouKey, Array<{ id: string; nameZh: string; zhouName: string }>> = {
  雍: [
    { id: "yongzhou-changan", nameZh: "长安", zhouName: "雍州" },
    { id: "yongzhou-tianshui", nameZh: "天水", zhouName: "雍州" },
    { id: "yongzhou-wuwei", nameZh: "武威", zhouName: "雍州" }
  ],
  梁: [
    { id: "liangzhou-hanzhong", nameZh: "汉中", zhouName: "梁州" },
    { id: "liangzhou-chengdu", nameZh: "成都", zhouName: "梁州" },
    { id: "liangzhou-zitong", nameZh: "梓潼", zhouName: "梁州" }
  ],
  荆: [
    { id: "jingzhou-jiangling", nameZh: "江陵", zhouName: "荆州" },
    { id: "jingzhou-xiangyang", nameZh: "襄阳", zhouName: "荆州" },
    { id: "jingzhou-changsha", nameZh: "长沙", zhouName: "荆州" },
    { id: "jingzhou-wuling", nameZh: "武陵", zhouName: "荆州" }
  ],
  扬: [
    { id: "yangzhou-jianye", nameZh: "建业", zhouName: "扬州" },
    { id: "yangzhou-wujun", nameZh: "吴郡", zhouName: "扬州" },
    { id: "yangzhou-chaisang", nameZh: "柴桑", zhouName: "扬州" }
  ],
  徐: [
    { id: "xuzhou-xiapi", nameZh: "下邳", zhouName: "徐州" },
    { id: "xuzhou-pengcheng", nameZh: "彭城", zhouName: "徐州" },
    { id: "xuzhou-langya", nameZh: "琅琊", zhouName: "徐州" }
  ],
  青: [
    { id: "qingzhou-beihai", nameZh: "北海", zhouName: "青州" },
    { id: "qingzhou-linzi", nameZh: "临淄", zhouName: "青州" },
    { id: "qingzhou-pingyuan", nameZh: "平原", zhouName: "青州" }
  ],
  兖: [
    { id: "yanzhou-puyang", nameZh: "濮阳", zhouName: "兖州" },
    { id: "yanzhou-chenliu", nameZh: "陈留", zhouName: "兖州" },
    { id: "yanzhou-dongping", nameZh: "东平", zhouName: "兖州" }
  ],
  冀: [
    { id: "jizhou-yecheng", nameZh: "邺城", zhouName: "冀州" },
    { id: "jizhou-jinyang", nameZh: "晋阳", zhouName: "冀州" },
    { id: "jizhou-changshan", nameZh: "常山", zhouName: "冀州" },
    { id: "jizhou-zhongshan", nameZh: "中山", zhouName: "冀州" }
  ],
  豫: [
    { id: "yuzhou-xuchang", nameZh: "许昌", zhouName: "豫州" },
    { id: "yuzhou-luoyang", nameZh: "洛阳", zhouName: "豫州" },
    { id: "yuzhou-runan", nameZh: "汝南", zhouName: "豫州" },
    { id: "yuzhou-wancheng", nameZh: "宛城", zhouName: "豫州" }
  ]
};

const specialTiles: SpecialTile[] = [
  special("start", "起点", "🏁"),
  special("chance-a", "机会", "🎴"),
  special("tax", "赋税", "💰"),
  special("station", "驿站", "🐎"),
  special("destiny-a", "命运", "📜"),
  special("chest", "宝箱", "🎁"),
  special("chance-b", "机会", "🎴"),
  special("jail", "牢狱", "⛓"),
  special("destiny-b", "命运", "📜"),
  special("go-to-jail", "押往牢狱", "🚨")
];

export function buildBoardOrder(): BoardTileConfig[] {
  const out: BoardTileConfig[] = [];
  out.push(specialTiles[0]);
  for (let zhouIndex = 0; zhouIndex < ZHOU_ORDER.length; zhouIndex += 1) {
    const zhouKey = ZHOU_ORDER[zhouIndex];
    const list = propertyByZhou[zhouKey];
    list.forEach((item, laneIndex) => {
      out.push(property(item.id, item.nameZh, zhouKey, item.zhouName, zhouIndex, laneIndex));
    });
    out.push(specialTiles[zhouIndex + 1]);
  }
  return out;
}

export const BOARD_TILES: BoardTileConfig[] = buildBoardOrder();

const propertyCount = BOARD_TILES.filter((tile) => tile.type === "property").length;
const specialCount = BOARD_TILES.filter((tile) => tile.type === "special").length;
const compactPath = BOARD_TILES.filter((tile) => tile.type !== "special") as PropertyTile[];
const zoneSpan = new Map<ZhouKey, { first: number; last: number }>();
compactPath.forEach((tile, idx) => {
  const current = zoneSpan.get(tile.zhouKey);
  if (!current) {
    zoneSpan.set(tile.zhouKey, { first: idx, last: idx });
    return;
  }
  current.last = idx;
});

const hasContinuousZhouBlocks = Array.from(zoneSpan.entries()).every(([zhouKey, span]) =>
  compactPath.slice(span.first, span.last + 1).every((tile) => tile.zhouKey === zhouKey)
);
const hasSpecialBetweenZhou = (() => {
  const propertyIndexes = BOARD_TILES.map((tile, index) => ({ tile, index })).filter(
    (item): item is { tile: PropertyTile; index: number } => item.tile.type === "property"
  );
  for (let i = 1; i < propertyIndexes.length; i += 1) {
    const prev = propertyIndexes[i - 1];
    const next = propertyIndexes[i];
    if (prev.tile.zhouKey === next.tile.zhouKey) {
      continue;
    }
    const between = BOARD_TILES.slice(prev.index + 1, next.index);
    if (!between.some((tile) => tile.type === "special")) {
      return false;
    }
  }
  return true;
})();

if (
  BOARD_TILES.length !== 40 ||
  propertyCount !== 30 ||
  specialCount !== 10 ||
  !hasContinuousZhouBlocks ||
  !hasSpecialBetweenZhou
) {
  throw new Error("board config invalid: expected 40 tiles (30 property + 10 special)");
}
