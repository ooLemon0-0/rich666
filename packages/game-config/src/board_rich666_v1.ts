export type BoardTileType = "property" | "special";

export interface BoardTile {
  index: number;
  type: BoardTileType;
  name: string;
  mapX: number;
  mapY: number;
  zhou?: string;
  zhouAbbr?: string;
  buyPrice?: number;
  rent?: number;
  upgradeCost?: number;
  rentByLevel?: number[];
  specialKey?: string;
}

export interface BoardConfig {
  id: string;
  version: number;
  totalTiles: number;
  gridSize: number;
  fixedTileSizePx: number;
  gridUnitPx: number;
  corners: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  };
  tiles: BoardTile[];
}

export const TILE_MAP_POSITIONS_72: Array<{ x: number; y: number }> = [
  { x: 52.2, y: 20.4 },
  { x: 57, y: 13.6 },
  { x: 65.5, y: 12.3 },
  { x: 75.7, y: 11.7 },
  { x: 87.6, y: 9.6 },
  { x: 75.4, y: 20 },
  { x: 65.3, y: 21.2 },
  { x: 67.8, y: 30.1 },
  { x: 59.1, y: 29.3 },
  { x: 53.5, y: 29.8 },
  { x: 46.2, y: 31 },
  { x: 54.1, y: 37.6 },
  { x: 62.1, y: 38 },
  { x: 69.9, y: 36.1 },
  { x: 77.9, y: 28.5 },
  { x: 91, y: 26.8 },
  { x: 85.7, y: 33.6 },
  { x: 78, y: 38.2 },
  { x: 70.8, y: 47.1 },
  { x: 78.7, y: 45.2 },
  { x: 87.4, y: 48.2 },
  { x: 77.1, y: 54.1 },
  { x: 88.4, y: 60.3 },
  { x: 65.5, y: 57.5 },
  { x: 80.3, y: 66.2 },
  { x: 56.3, y: 60.8 },
  { x: 56.8, y: 51.7 },
  { x: 52.4, y: 45.1 },
  { x: 44, y: 40.2 },
  { x: 42.9, y: 48.3 },
  { x: 33.7, y: 48.3 },
  { x: 38.4, y: 54.7 },
  { x: 44.5, y: 59.8 },
  { x: 49.5, y: 65.7 },
  { x: 57, y: 68.8 },
  { x: 63, y: 76.6 },
  { x: 71.2, y: 70.4 },
  { x: 85.3, y: 73.5 },
  { x: 88, y: 81.8 },
  { x: 81.8, y: 86.3 },
  { x: 71, y: 87.2 },
  { x: 61.7, y: 87.5 },
  { x: 52.6, y: 81.4 },
  { x: 41.6, y: 71 },
  { x: 43.8, y: 83.3 },
  { x: 33.9, y: 80.9 },
  { x: 25.6, y: 85.6 },
  { x: 31, y: 69.1 },
  { x: 28, y: 58.6 },
  { x: 22.5, y: 67.6 },
  { x: 21.4, y: 58.3 },
  { x: 18.9, y: 75.3 },
  { x: 13.7, y: 67.2 },
  { x: 12.3, y: 58.6 },
  { x: 22.5, y: 51 },
  { x: 34.3, y: 35.9 },
  { x: 24.3, y: 43.7 },
  { x: 12.3, y: 44.5 },
  { x: 14.7, y: 37.8 },
  { x: 22.6, y: 34.1 },
  { x: 12.2, y: 31.2 },
  { x: 13.2, y: 24.7 },
  { x: 20.1, y: 26.6 },
  { x: 18.5, y: 19.6 },
  { x: 27.3, y: 18.9 },
  { x: 23.4, y: 13 },
  { x: 31.5, y: 12 },
  { x: 39.9, y: 10.1 },
  { x: 43.3, y: 16.3 },
  { x: 35.7, y: 21.5 },
  { x: 39.3, y: 27.7 },
  { x: 45.4, y: 23.6 }
];

export const BOARD_RICH666_V1: BoardConfig = {
  id: "rich666_v1",
  version: 3,
  totalTiles: 72,
  gridSize: 100,
  fixedTileSizePx: 96,
  gridUnitPx: 32,
  corners: { topLeft: 0, topRight: 19, bottomRight: 35, bottomLeft: 54 },
  tiles: buildTiles72()
};

function makeProperty(
  index: number,
  zhou: string,
  zhouAbbr: string,
  name: string,
  buyPrice: number,
  baseRent: number
): BoardTile {
  // ✅ 让升级租金更像大富翁：明显倍增（1x / 2x / 4.5x / 10x）
  const level1 = Math.round(baseRent * 2.0);
  const level2 = Math.round(baseRent * 4.5);
  const level3 = Math.round(baseRent * 10.0);
  return {
    index,
    type: "property",
    mapX: 0,
    mapY: 0,
    zhou,
    zhouAbbr,
    name,
    buyPrice,
    rent: baseRent,
    upgradeCost: Math.round(buyPrice * 0.55),
    rentByLevel: [baseRent, level1, level2, level3]
  };
}

function makeSpecial(index: number, name: string, specialKey: string): BoardTile {
  return {
    index,
    type: "special",
    mapX: 0,
    mapY: 0,
    name,
    specialKey
  };
}

function buildTiles72(): BoardTile[] {
  const out: BoardTile[] = [];
  let index = 0;
  const pushPropertyBlock = (zhou: string, zhouAbbr: string, cities: Array<[string, number, number]>) => {
    cities.forEach(([name, buyPrice, baseRent]) => {
      out.push(makeProperty(index, zhou, zhouAbbr, name, buyPrice, baseRent));
      index += 1;
    });
  };
  const pushSpecial = (name: string, key: string) => {
    out.push(makeSpecial(index, name, key));
    index += 1;
  };

  pushSpecial("起点", "start"); // 0

  // 冀州：邺城为北方核心；晋阳次之；北平/辽东偏边郡
  pushPropertyBlock("冀州", "冀", [
    ["邺城", 440, 50],
    ["晋阳", 380, 44],
    ["北平", 330, 38],
    ["辽东", 310, 36]
  ]); // 1-4

  pushSpecial("命运", "fate"); // 5

  // 平原：中等
  pushPropertyBlock("冀州", "冀", [["平原", 300, 34]]); // 6

  // 兖州：陈留更强；濮阳中上；其他中等
  pushPropertyBlock("兖州", "兖", [
    ["濮阳", 300, 34],
    ["陈留", 340, 38],
    ["东平", 280, 32],
    ["延津", 260, 30],
    ["白马", 270, 31],
    ["汝阳", 250, 29]
  ]); // 7-12

  // 青州：临淄更强；曲阜中上；北海/东莱中等
  pushPropertyBlock("青州", "青", [
    ["曲阜", 300, 34],
    ["临淄", 340, 38],
    ["北海", 280, 32],
    ["东莱", 260, 30]
  ]); // 13-16

  pushSpecial("道具店", "item_shop"); // 17

  // 乐安：偏弱
  pushPropertyBlock("青州", "青", [["乐安", 240, 28]]); // 18

  pushSpecial("牢狱", "jail"); // 19

  // 徐州：彭城核心；下邳次之；琅琊中等
  pushPropertyBlock("徐州", "徐", [
    ["下邳", 320, 36],
    ["彭城", 360, 40],
    ["琅琊", 280, 32]
  ]); // 20-22

  pushSpecial("道具店", "item_shop"); // 23

  // 东海/泗水：偏弱
  pushPropertyBlock("徐州", "徐", [
    ["东海", 260, 30],
    ["泗水", 240, 28]
  ]); // 24-25

  pushSpecial("命运", "fate"); // 26

  // 豫州：洛阳顶级；许昌次顶级；颍川/汝南中上；宛城中上
  pushPropertyBlock("豫州", "豫", [
    ["许昌", 460, 54],
    ["洛阳", 520, 60],
    ["汝南", 400, 46],
    ["宛城", 380, 44],
    ["颍川", 420, 50]
  ]); // 27-31

  pushSpecial("命运", "fate"); // 32

  // 南郑（接近汉中/益州门户）比江夏略强，但这两格你原来是 100/10，明显过低，改成“中下”档
  pushPropertyBlock("豫州", "豫", [
    ["南郑", 260, 30],
    ["江夏", 240, 28]
  ]); // 33-34

  pushSpecial("命运", "fate"); // 35

  // 扬州：建业核心；吴郡次核心；柴桑中等
  pushPropertyBlock("扬州", "扬", [
    ["建业", 480, 55],
    ["吴郡", 430, 50],
    ["柴桑", 340, 40]
  ]); // 36-38

  pushSpecial("命运", "fate"); // 39

  // 会稽：江东强郡，中上
  pushPropertyBlock("扬州", "扬", [["会稽", 400, 46]]); // 40

  pushSpecial("道具店", "item_shop"); // 41

  // 荆州：襄阳/江陵为战略要地（高）；长沙中上；武陵/桂阳中
  pushPropertyBlock("荆州", "荆", [
    ["江陵", 420, 48],
    ["襄阳", 450, 52],
    ["长沙", 360, 42],
    ["武陵", 320, 38],
    ["桂阳", 300, 36]
  ]); // 42-46

  pushSpecial("道具店", "item_shop"); // 47

  // 梁州（你这里实质是益州/蜀地风格）：成都核心（高）；汉中次高；江州中上；其余中
  pushPropertyBlock("梁州", "梁", [
    ["汉中", 400, 46],
    ["成都", 460, 52],
    ["梓潼", 320, 38],
    ["巴西", 300, 36],
    ["江州", 340, 40],
    ["永安", 280, 34]
  ]); // 48-53

  pushSpecial("命运", "fate"); // 54

  // 雍州：长安顶级；天水/陇西中上；武威中上；安定中
  pushPropertyBlock("雍州", "雍", [
    ["长安", 500, 58],
    ["天水", 380, 44],
    ["武威", 360, 42],
    ["安定", 330, 39],
    ["陇西", 340, 40]
  ]); // 55-59

  pushSpecial("道具店", "item_shop"); // 60
  pushSpecial("命运", "fate"); // 61

  // 凉州：边塞整体偏弱，但酒泉/居庸更“有名”一点
  pushPropertyBlock("凉州", "凉", [
    ["银边", 220, 26],
    ["宁夏", 260, 30],
    ["居庸", 300, 34],
    ["酒泉", 320, 36]
  ]); // 62-65

  pushSpecial("命运", "fate"); // 66

  // 晋州：平遥中等；太行偏弱（但不该 100/10 那么离谱）
  pushPropertyBlock("晋州", "晋", [
    ["平遥", 300, 34],
    ["太行", 240, 28]
  ]); // 67-68

  pushSpecial("命运", "fate"); // 69

  // 上党/长平：长平之战更出名 → 更贵更凶
  pushPropertyBlock("晋州", "晋", [
    ["上党", 300, 34],
    ["长平", 340, 40]
  ]); // 70-71

  out.forEach((tile, index) => {
    const pos = TILE_MAP_POSITIONS_72[index] ?? { x: 50, y: 50 };
    tile.mapX = pos.x;
    tile.mapY = pos.y;
  });
  return out;
}