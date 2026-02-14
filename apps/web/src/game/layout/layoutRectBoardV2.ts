export interface RectBoardPointV2 {
  xPct: number;
  yPct: number;
  angle: number;
  widthPx: number;
  heightPx: number;
  isCorner: boolean;
}

export interface RectBoardLayoutV2Result {
  points: RectBoardPointV2[];
  boardScale: number;
  collisionPairs: Array<[number, number]>;
}

interface RectBoardLayoutV2Input {
  stageWidth: number;
  stageHeight: number;
  tileCount: number;
  cornerSize: number;
  edgeSize: number;
  margin: number;
  minScale?: number;
  safetyGap?: number;
}

interface AbsPoint {
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
  isCorner: boolean;
}

function isCornerIndex(index: number): boolean {
  return index % 10 === 0;
}

function getCollisionPairs(points: AbsPoint[], gap: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      const halfW = (a.width + b.width) / 2 + gap;
      const halfH = (a.height + b.height) / 2 + gap;
      if (Math.abs(a.x - b.x) < halfW && Math.abs(a.y - b.y) < halfH) {
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
}

function buildSideCenters(start: number, end: number, steps: number): number[] {
  return Array.from({ length: steps }, (_unused, idx) => start + ((idx + 0.5) * (end - start)) / steps);
}

export function layoutRectBoardV2(input: RectBoardLayoutV2Input): RectBoardLayoutV2Result {
  const minScale = input.minScale ?? 0.66;
  const safetyGap = input.safetyGap ?? 2;

  const points: AbsPoint[] = [];
  let boardScale = 1;

  while (boardScale >= minScale) {
    points.length = 0;

    const corner = input.cornerSize * boardScale;
    const edge = input.edgeSize * boardScale;
    const left = input.margin + corner / 2;
    const top = input.margin + corner / 2;
    const right = input.stageWidth - input.margin - corner / 2;
    const bottom = input.stageHeight - input.margin - corner / 2;
    const innerLeft = left + corner / 2;
    const innerRight = right - corner / 2;
    const innerTop = top + corner / 2;
    const innerBottom = bottom - corner / 2;

    const topCenters = buildSideCenters(innerLeft, innerRight, 9);
    const rightCenters = buildSideCenters(innerTop, innerBottom, 9);
    const bottomCenters = buildSideCenters(innerRight, innerLeft, 9);
    const leftCenters = buildSideCenters(innerBottom, innerTop, 9);

    for (let i = 0; i < input.tileCount; i += 1) {
      const side = Math.floor(i / 10);
      const slot = i % 10;
      const cornerTile = isCornerIndex(i);
      const width = cornerTile ? corner : edge;
      const height = cornerTile ? corner : edge;
      if (side === 0) {
        points.push({
          x: slot === 0 ? left : topCenters[slot - 1],
          y: top,
          angle: 0,
          width,
          height,
          isCorner: cornerTile
        });
      } else if (side === 1) {
        points.push({
          x: right,
          y: slot === 0 ? top : rightCenters[slot - 1],
          angle: 90,
          width,
          height,
          isCorner: cornerTile
        });
      } else if (side === 2) {
        points.push({
          x: slot === 0 ? right : bottomCenters[slot - 1],
          y: bottom,
          angle: 180,
          width,
          height,
          isCorner: cornerTile
        });
      } else {
        points.push({
          x: left,
          y: slot === 0 ? bottom : leftCenters[slot - 1],
          angle: 270,
          width,
          height,
          isCorner: cornerTile
        });
      }
    }

    const collisions = getCollisionPairs(points, safetyGap);
    if (collisions.length === 0) {
      return {
        boardScale,
        collisionPairs: collisions,
        points: points.map((point) => ({
          xPct: (point.x / input.stageWidth) * 100,
          yPct: (point.y / input.stageHeight) * 100,
          angle: point.angle,
          widthPx: point.width,
          heightPx: point.height,
          isCorner: point.isCorner
        }))
      };
    }

    boardScale = Number((boardScale * 0.97).toFixed(4));
  }

  return {
    boardScale,
    collisionPairs: getCollisionPairs(points, safetyGap),
    points: points.map((point) => ({
      xPct: (point.x / input.stageWidth) * 100,
      yPct: (point.y / input.stageHeight) * 100,
      angle: point.angle,
      widthPx: point.width,
      heightPx: point.height,
      isCorner: point.isCorner
    }))
  };
}
