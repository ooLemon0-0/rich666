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

function property(index: number, tileId: string, name: string, zhouRank: number, lane: number): ServerTileConfig {
  const price = 220 + zhouRank * 55 + lane * 35;
  return {
    index,
    tileId,
    name,
    kind: "property",
    price,
    rent: Math.max(40, Math.floor(price * 0.22))
  };
}

function special(index: number, tileId: string, name: string): ServerTileConfig {
  return {
    index,
    tileId,
    name,
    kind: "special",
    price: 0,
    rent: 0
  };
}

export const TILES_CONFIG: ServerTileConfig[] = [
  special(0, "start", "起点"),
  property(1, "jizhou-yecheng", "邺城", 0, 0),
  property(2, "jizhou-jinyang", "晋阳", 0, 1),
  property(3, "jizhou-changshan", "常山", 0, 2),
  property(4, "jizhou-zhongshan", "中山", 0, 3),
  special(5, "chance-a", "机会"),
  property(6, "yanzhou-puyang", "濮阳", 1, 0),
  property(7, "yanzhou-chenliu", "陈留", 1, 1),
  property(8, "yanzhou-dongping", "东平", 1, 2),
  special(9, "tax", "赋税"),
  property(10, "qingzhou-beihai", "北海", 2, 0),
  property(11, "qingzhou-linzi", "临淄", 2, 1),
  property(12, "qingzhou-pingyuan", "平原", 2, 2),
  special(13, "station", "驿站"),
  property(14, "xuzhou-xiapi", "下邳", 3, 0),
  property(15, "xuzhou-pengcheng", "彭城", 3, 1),
  property(16, "xuzhou-langya", "琅琊", 3, 2),
  special(17, "destiny-a", "命运"),
  property(18, "yuzhou-xuchang", "许昌", 4, 0),
  property(19, "yuzhou-luoyang", "洛阳", 4, 1),
  property(20, "yuzhou-runan", "汝南", 4, 2),
  property(21, "yuzhou-wancheng", "宛城", 4, 3),
  special(22, "chest", "宝箱"),
  property(23, "yangzhou-jianye", "建业", 5, 0),
  property(24, "yangzhou-wujun", "吴郡", 5, 1),
  property(25, "yangzhou-chaisang", "柴桑", 5, 2),
  special(26, "chance-b", "机会"),
  property(27, "jingzhou-jiangling", "江陵", 6, 0),
  property(28, "jingzhou-xiangyang", "襄阳", 6, 1),
  property(29, "jingzhou-changsha", "长沙", 6, 2),
  property(30, "jingzhou-wuling", "武陵", 6, 3),
  special(31, "jail", "牢狱"),
  property(32, "liangzhou-hanzhong", "汉中", 7, 0),
  property(33, "liangzhou-chengdu", "成都", 7, 1),
  property(34, "liangzhou-zitong", "梓潼", 7, 2),
  special(35, "destiny-b", "命运"),
  property(36, "yongzhou-changan", "长安", 8, 0),
  property(37, "yongzhou-tianshui", "天水", 8, 1),
  property(38, "yongzhou-wuwei", "武威", 8, 2),
  special(39, "go-to-jail", "押往牢狱")
];

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
