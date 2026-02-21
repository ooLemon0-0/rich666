# 地图坐标（100x100）说明

## 设计目标
- 地图坐标系固定为 `100 x 100` 网格。
- 每个地块大小固定，不再随浏览器窗口动态缩放。
- 玩家行走顺序仍按地块 `index`（0 -> 1 -> 2 ...）推进。
- 仅“地图上的位置”可自定义。

## 当前生效配置
- 地图配置文件：`packages/game-config/src/board_rich666_v1.ts`
- 坐标数组：`TILE_MAP_POSITIONS_72`
- 单格坐标字段：
  - `mapX`：0~100
  - `mapY`：0~100
- 固定渲染参数：
  - `gridSize: 100`
  - `fixedTileSizePx: 96`
  - `gridUnitPx: 32`

## 如何自定义地块位置
1. 打开 `packages/game-config/src/board_rich666_v1.ts`
2. 修改 `TILE_MAP_POSITIONS_72[index] = { x, y }`
3. 保持数组长度与 `totalTiles` 一致（当前为 72）
4. 保存后前端会按新坐标渲染，移动顺序不变

## 坐标规则建议
- 允许使用小数坐标（更平滑）。
- 建议坐标范围保持在 `8~92`，避免贴边。
- 尽量避免相邻 index 距离过近，防止视觉重叠。

## 注意
- 只改坐标不会改变回合与掷骰逻辑。
- 若后续加减地块，请同步：
  - `totalTiles`
  - `TILE_MAP_POSITIONS_72` 长度（或改成新的位置数组名）
