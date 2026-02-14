export type BoardTileType = "property" | "special";

export interface BoardTile {
  index: number;
  type: BoardTileType;
  name: string;
  zhou?: string;
  zhouAbbr?: string;
  buyPrice?: number;
  rent?: number;
  upgradeCost?: number;
  rentUpgraded?: number;
  specialKey?: string;
}

export interface BoardConfig {
  id: string;
  version: number;
  totalTiles: number;
  corners: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  };
  tiles: BoardTile[];
}

export const BOARD_RICH666_V1: BoardConfig = {
  id: "rich666_v1",
  version: 1,
  totalTiles: 40,
  corners: { topLeft: 0, topRight: 13, bottomRight: 22, bottomLeft: 32 },
  tiles: [
    { index: 0, type: "special", name: "起点", specialKey: "start" },

    { index: 1, type: "property", zhou: "冀州", zhouAbbr: "冀", name: "邺城", buyPrice: 340, rent: 40 },
    { index: 2, type: "property", zhou: "冀州", zhouAbbr: "冀", name: "晋阳", buyPrice: 320, rent: 38 },
    { index: 3, type: "property", zhou: "冀州", zhouAbbr: "冀", name: "常山", buyPrice: 300, rent: 36 },
    { index: 4, type: "property", zhou: "冀州", zhouAbbr: "冀", name: "中山", buyPrice: 280, rent: 34 },

    { index: 5, type: "special", name: "机会", specialKey: "chance" },

    { index: 6, type: "property", zhou: "兖州", zhouAbbr: "兖", name: "濮阳", buyPrice: 260, rent: 30 },
    { index: 7, type: "property", zhou: "兖州", zhouAbbr: "兖", name: "陈留", buyPrice: 280, rent: 32 },
    { index: 8, type: "property", zhou: "兖州", zhouAbbr: "兖", name: "东平", buyPrice: 240, rent: 28 },

    { index: 9, type: "special", name: "命运", specialKey: "fate" },

    { index: 10, type: "property", zhou: "青州", zhouAbbr: "青", name: "北海", buyPrice: 250, rent: 30 },
    { index: 11, type: "property", zhou: "青州", zhouAbbr: "青", name: "临淄", buyPrice: 270, rent: 32 },
    { index: 12, type: "property", zhou: "青州", zhouAbbr: "青", name: "平原", buyPrice: 230, rent: 28 },

    { index: 13, type: "special", name: "牢狱", specialKey: "jail" },

    { index: 14, type: "property", zhou: "徐州", zhouAbbr: "徐", name: "下邳", buyPrice: 240, rent: 28 },
    { index: 15, type: "property", zhou: "徐州", zhouAbbr: "徐", name: "彭城", buyPrice: 260, rent: 30 },
    { index: 16, type: "property", zhou: "徐州", zhouAbbr: "徐", name: "琅琊", buyPrice: 220, rent: 26 },

    { index: 17, type: "special", name: "赋税", specialKey: "tax" },

    { index: 18, type: "property", zhou: "豫州", zhouAbbr: "豫", name: "许昌", buyPrice: 380, rent: 44 },
    { index: 19, type: "property", zhou: "豫州", zhouAbbr: "豫", name: "洛阳", buyPrice: 420, rent: 50 },
    { index: 20, type: "property", zhou: "豫州", zhouAbbr: "豫", name: "汝南", buyPrice: 360, rent: 42 },
    { index: 21, type: "property", zhou: "豫州", zhouAbbr: "豫", name: "宛城", buyPrice: 340, rent: 40 },

    { index: 22, type: "special", name: "押往牢狱", specialKey: "go_to_jail" },

    { index: 23, type: "property", zhou: "扬州", zhouAbbr: "扬", name: "建业", buyPrice: 320, rent: 36 },
    { index: 24, type: "property", zhou: "扬州", zhouAbbr: "扬", name: "吴郡", buyPrice: 340, rent: 38 },
    { index: 25, type: "property", zhou: "扬州", zhouAbbr: "扬", name: "柴桑", buyPrice: 300, rent: 34 },

    { index: 26, type: "special", name: "命运", specialKey: "fate" },

    { index: 27, type: "property", zhou: "荆州", zhouAbbr: "荆", name: "江陵", buyPrice: 360, rent: 42 },
    { index: 28, type: "property", zhou: "荆州", zhouAbbr: "荆", name: "襄阳", buyPrice: 400, rent: 46 },
    { index: 29, type: "property", zhou: "荆州", zhouAbbr: "荆", name: "长沙", buyPrice: 340, rent: 40 },
    { index: 30, type: "property", zhou: "荆州", zhouAbbr: "荆", name: "武陵", buyPrice: 320, rent: 38 },

    { index: 31, type: "special", name: "驿站", specialKey: "post" },

    { index: 32, type: "special", name: "宝箱", specialKey: "chest" },

    { index: 33, type: "property", zhou: "梁州", zhouAbbr: "梁", name: "汉中", buyPrice: 300, rent: 34 },
    { index: 34, type: "property", zhou: "梁州", zhouAbbr: "梁", name: "成都", buyPrice: 360, rent: 40 },
    { index: 35, type: "property", zhou: "梁州", zhouAbbr: "梁", name: "梓潼", buyPrice: 280, rent: 32 },

    { index: 36, type: "special", name: "机会", specialKey: "chance" },

    { index: 37, type: "property", zhou: "雍州", zhouAbbr: "雍", name: "长安", buyPrice: 380, rent: 44 },
    { index: 38, type: "property", zhou: "雍州", zhouAbbr: "雍", name: "天水", buyPrice: 340, rent: 40 },
    { index: 39, type: "property", zhou: "雍州", zhouAbbr: "雍", name: "武威", buyPrice: 320, rent: 38 }
  ]
};
