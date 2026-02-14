export interface RectBoardPointV2 {
  xPct: number;
  yPct: number;
  angle: number;
  width: number;
  height: number;
  isCorner: boolean;
}

export interface RectBoardLayoutResultV2 {
  points: RectBoardPointV2[];
  tileScale: number;
  collisionPairs: Array<[number, number]>;
}

interface RectBoardLayoutInputV2 {
  stageWidth: number;
  stageHeight: number;
  tileCount: number;
  edgeSize: number;
  cornerSize: number;
  margin: number;
  safeScaleMultiplier?: number;
  minScale?: number;
}

interface AbsPoint {
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
  isCorner: boolean;
}

function getCollisionPairs(points: AbsPoint[], tileScale: number, safeScaleMultiplier: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < points.length; i += 1) {
    const leftA = points[i].x - ((points[i].width * tileScale * safeScaleMultiplier) / 2);
    const rightA = points[i].x + ((points[i].width * tileScale * safeScaleMultiplier) / 2);
    const topA = points[i].y - ((points[i].height * tileScale * safeScaleMultiplier) / 2);
    const bottomA = points[i].y + ((points[i].height * tileScale * safeScaleMultiplier) / 2);
    for (let j = i + 1; j < points.length; j += 1) {
      const leftB = points[j].x - ((points[j].width * tileScale * safeScaleMultiplier) / 2);
      const rightB = points[j].x + ((points[j].width * tileScale * safeScaleMultiplier) / 2);
      const topB = points[j].y - ((points[j].height * tileScale * safeScaleMultiplier) / 2);
      const bottomB = points[j].y + ((points[j].height * tileScale * safeScaleMultiplier) / 2);
      const overlapX = leftA < rightB && rightA > leftB;
      const overlapY = topA < bottomB && bottomA > topB;
      if (overlapX && overlapY) {
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
}

export function layoutRectBoardV2(input: RectBoardLayoutInputV2): RectBoardLayoutResultV2 {
  const sideSlots = Math.floor(input.tileCount / 4);
  const edgeCount = Math.max(0, sideSlots - 1);
  const safeScaleMultiplier = input.safeScaleMultiplier ?? 1.08;
  const minScale = input.minScale ?? 0.7;

  const availableWidth = input.stageWidth - input.margin * 2;
  const availableHeight = input.stageHeight - input.margin * 2;
  const requiredWidth = input.cornerSize * 2 + input.edgeSize * edgeCount;
  const requiredHeight = input.cornerSize * 2 + input.edgeSize * edgeCount;
  let tileScale = Math.min(1, (availableWidth / requiredWidth) * 0.985, (availableHeight / requiredHeight) * 0.985);
  tileScale = Math.max(minScale, Number(tileScale.toFixed(4)));

  const halfCorner = input.cornerSize / 2;
  const halfEdge = input.edgeSize / 2;
  const left = input.margin + halfCorner;
  const right = input.stageWidth - input.margin - halfCorner;
  const top = input.margin + halfCorner;
  const bottom = input.stageHeight - input.margin - halfCorner;

  const innerLeft = left + halfCorner + halfEdge;
  const innerRight = right - halfCorner - halfEdge;
  const innerTop = top + halfCorner + halfEdge;
  const innerBottom = bottom - halfCorner - halfEdge;
  const edgeStepX = edgeCount > 1 ? (innerRight - innerLeft) / (edgeCount - 1) : 0;
  const edgeStepY = edgeCount > 1 ? (innerBottom - innerTop) / (edgeCount - 1) : 0;

  const points: AbsPoint[] = [];
  points.push({ x: left, y: top, angle: 0, width: input.cornerSize, height: input.cornerSize, isCorner: true });
  for (let i = 0; i < edgeCount; i += 1) {
    points.push({
      x: innerLeft + edgeStepX * i,
      y: top,
      angle: 0,
      width: input.edgeSize,
      height: input.edgeSize,
      isCorner: false
    });
  }
  points.push({ x: right, y: top, angle: 90, width: input.cornerSize, height: input.cornerSize, isCorner: true });
  for (let i = 0; i < edgeCount; i += 1) {
    points.push({
      x: right,
      y: innerTop + edgeStepY * i,
      angle: 90,
      width: input.edgeSize,
      height: input.edgeSize,
      isCorner: false
    });
  }
  points.push({ x: right, y: bottom, angle: 180, width: input.cornerSize, height: input.cornerSize, isCorner: true });
  for (let i = edgeCount - 1; i >= 0; i -= 1) {
    points.push({
      x: innerLeft + edgeStepX * i,
      y: bottom,
      angle: 180,
      width: input.edgeSize,
      height: input.edgeSize,
      isCorner: false
    });
  }
  points.push({ x: left, y: bottom, angle: 270, width: input.cornerSize, height: input.cornerSize, isCorner: true });
  for (let i = edgeCount - 1; i >= 0; i -= 1) {
    points.push({
      x: left,
      y: innerTop + edgeStepY * i,
      angle: 270,
      width: input.edgeSize,
      height: input.edgeSize,
      isCorner: false
    });
  }

  let pairs = getCollisionPairs(points, tileScale, safeScaleMultiplier);
  while (pairs.length > 0 && tileScale > minScale) {
    tileScale = Math.max(minScale, Number((tileScale * 0.97).toFixed(4)));
    pairs = getCollisionPairs(points, tileScale, safeScaleMultiplier);
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
      width: point.width,
      height: point.height,
      isCorner: point.isCorner
    }))
  };
}
