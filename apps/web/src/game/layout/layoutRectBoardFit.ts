export interface RectBoardFitPoint {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  angle: number;
  isCorner: boolean;
}

export interface RectBoardFitResult {
  points: RectBoardFitPoint[];
  boardScale: number;
}

interface RectBoardFitInput {
  stageWidth: number;
  stageHeight: number;
  tileCount?: number;
  cornerSize?: number;
  edgeSize?: number;
  margin?: number;
}

interface AbsPoint {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  isCorner: boolean;
}

export function layoutRectBoardFit(input: RectBoardFitInput): RectBoardFitResult {
  const tileCount = input.tileCount ?? 40;
  const cornerBase = input.cornerSize ?? 142;
  const edgeBase = input.edgeSize ?? 104;
  const marginBase = input.margin ?? 42;

  const boardWIdeal = marginBase * 2 + cornerBase * 2 + edgeBase * 8;
  const boardHIdeal = marginBase * 2 + cornerBase * 2 + edgeBase * 8;
  const boardScale = Math.min(1, (input.stageWidth / boardWIdeal) * 0.98, (input.stageHeight / boardHIdeal) * 0.98);

  const corner = cornerBase * boardScale;
  const edge = edgeBase * boardScale;
  const margin = marginBase * boardScale;

  const left = margin + corner / 2;
  const top = margin + corner / 2;
  const right = input.stageWidth - margin - corner / 2;
  const bottom = input.stageHeight - margin - corner / 2;

  const innerLeft = left + corner / 2;
  const innerRight = right - corner / 2;
  const innerTop = top + corner / 2;
  const innerBottom = bottom - corner / 2;

  const stepX = (innerRight - innerLeft) / 8;
  const stepY = (innerBottom - innerTop) / 8;
  const points: AbsPoint[] = [];

  for (let i = 0; i < tileCount; i += 1) {
    const side = Math.floor(i / 10);
    const slot = i % 10;
    const isCorner = slot === 0;
    const size = isCorner ? corner : edge;
    if (side === 0) {
      points.push({
        x: isCorner ? left : innerLeft + (slot - 0.5) * stepX,
        y: top,
        w: size,
        h: size,
        angle: 0,
        isCorner
      });
    } else if (side === 1) {
      points.push({
        x: right,
        y: isCorner ? top : innerTop + (slot - 0.5) * stepY,
        w: size,
        h: size,
        angle: 90,
        isCorner
      });
    } else if (side === 2) {
      points.push({
        x: isCorner ? right : innerRight - (slot - 0.5) * stepX,
        y: bottom,
        w: size,
        h: size,
        angle: 180,
        isCorner
      });
    } else {
      points.push({
        x: left,
        y: isCorner ? bottom : innerBottom - (slot - 0.5) * stepY,
        w: size,
        h: size,
        angle: 270,
        isCorner
      });
    }
  }

  return {
    boardScale,
    points: points.map((point) => ({
      xPct: (point.x / input.stageWidth) * 100,
      yPct: (point.y / input.stageHeight) * 100,
      wPct: (point.w / input.stageWidth) * 100,
      hPct: (point.h / input.stageHeight) * 100,
      angle: point.angle,
      isCorner: point.isCorner
    }))
  };
}
