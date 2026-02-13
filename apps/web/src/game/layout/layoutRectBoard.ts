export interface RectBoardPoint {
  xPct: number;
  yPct: number;
  angle: number;
  sideIndex: 0 | 1 | 2 | 3;
}

export interface RectBoardLayoutResult {
  points: RectBoardPoint[];
  tileScale: number;
  collisionPairs: Array<[number, number]>;
}

interface RectBoardLayoutInput {
  stageWidth: number;
  stageHeight: number;
  tileCount: number;
  tileWidth: number;
  tileHeight: number;
  margin: number;
  safeScaleMultiplier?: number;
  minScale?: number;
}

interface AbsPoint {
  x: number;
  y: number;
  angle: number;
  sideIndex: 0 | 1 | 2 | 3;
}

function getCollisionPairs(points: AbsPoint[], halfW: number, halfH: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dx = Math.abs(points[i].x - points[j].x);
      const dy = Math.abs(points[i].y - points[j].y);
      if (dx < halfW * 2 && dy < halfH * 2) {
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
}

function buildRectPoints(tileCount: number, stageWidth: number, stageHeight: number, margin: number): AbsPoint[] {
  const sideSlots = Math.floor(tileCount / 4);
  const left = margin;
  const top = margin;
  const right = stageWidth - margin;
  const bottom = stageHeight - margin;
  const points: AbsPoint[] = [];

  for (let i = 0; i < tileCount; i += 1) {
    const side = Math.floor(i / sideSlots) as 0 | 1 | 2 | 3;
    const slot = i % sideSlots;
    const t = (slot + 0.5) / sideSlots;
    if (side === 0) {
      points.push({ x: left + (right - left) * t, y: top, angle: 0, sideIndex: side });
    } else if (side === 1) {
      points.push({ x: right, y: top + (bottom - top) * t, angle: 90, sideIndex: side });
    } else if (side === 2) {
      points.push({ x: right - (right - left) * t, y: bottom, angle: 180, sideIndex: side });
    } else {
      points.push({ x: left, y: bottom - (bottom - top) * t, angle: 270, sideIndex: side });
    }
  }
  return points;
}

export function layoutRectBoard(input: RectBoardLayoutInput): RectBoardLayoutResult {
  const safeScaleMultiplier = input.safeScaleMultiplier ?? 1.1;
  const minScale = input.minScale ?? 0.72;
  const points = buildRectPoints(input.tileCount, input.stageWidth, input.stageHeight, input.margin);
  const sideSlots = Math.floor(input.tileCount / 4);
  const usableWidth = input.stageWidth - input.margin * 2;
  const usableHeight = input.stageHeight - input.margin * 2;
  const stepX = usableWidth / sideSlots;
  const stepY = usableHeight / sideSlots;

  let tileScale = Math.min(1, (stepX / input.tileWidth) * 0.95, (stepY / input.tileHeight) * 0.95);
  tileScale = Math.max(minScale, Number(tileScale.toFixed(4)));

  let pairs = getCollisionPairs(
    points,
    (input.tileWidth * tileScale * safeScaleMultiplier) / 2,
    (input.tileHeight * tileScale * safeScaleMultiplier) / 2
  );

  while (pairs.length > 0 && tileScale > minScale) {
    tileScale = Math.max(minScale, Number((tileScale * 0.97).toFixed(4)));
    pairs = getCollisionPairs(
      points,
      (input.tileWidth * tileScale * safeScaleMultiplier) / 2,
      (input.tileHeight * tileScale * safeScaleMultiplier) / 2
    );
    if (tileScale === minScale) {
      break;
    }
  }

  return {
    tileScale,
    collisionPairs: pairs,
    points: points.map((point) => ({
      xPct: (point.x / input.stageWidth) * 100,
      yPct: (point.y / input.stageHeight) * 100,
      angle: point.angle,
      sideIndex: point.sideIndex
    }))
  };
}
