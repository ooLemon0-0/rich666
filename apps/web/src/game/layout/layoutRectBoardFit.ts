export interface RectBoardFitPoint {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  isCorner: boolean;
  side: "top" | "right" | "bottom" | "left";
}

export interface RectBoardFitResult {
  points: RectBoardFitPoint[];
  boardScale: number;
}

interface RectBoardFitInput {
  stageWidth: number;
  stageHeight: number;
  tileCount?: number;
  corners?: [number, number, number, number];
  cornerSize?: number;
  edgeSize?: number;
  margin?: number;
  gap?: number;
}

interface AbsPoint {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  isCorner: boolean;
  side: "top" | "right" | "bottom" | "left";
}

export function layoutRectBoardFit(input: RectBoardFitInput): RectBoardFitResult {
  const tileCount = input.tileCount ?? 40;
  const corners = input.corners ?? [0, 10, 20, 30];
  const cornerBase = input.cornerSize ?? 142;
  const edgeBase = input.edgeSize ?? 104;
  const marginBase = input.margin ?? 42;
  const gapBase = input.gap ?? 6;

  const boardWIdeal = marginBase * 2 + cornerBase * 2 + edgeBase * 8;
  const boardHIdeal = marginBase * 2 + cornerBase * 2 + edgeBase * 8;
  const boardScale = Math.min(1, (input.stageWidth / boardWIdeal) * 0.98, (input.stageHeight / boardHIdeal) * 0.98);

  const corner = cornerBase * boardScale;
  const edge = edgeBase * boardScale;
  const margin = marginBase * boardScale;
  const gap = gapBase * boardScale;

  const left = margin + corner / 2;
  const top = margin + corner / 2;
  const right = input.stageWidth - margin - corner / 2;
  const bottom = input.stageHeight - margin - corner / 2;

  const innerLeft = left + corner / 2;
  const innerRight = right - corner / 2;
  const innerTop = top + corner / 2;
  const innerBottom = bottom - corner / 2;
  const points: AbsPoint[] = [];
  const sideDefs = [
    {
      start: corners[0],
      end: corners[1],
      angle: 0,
      side: "top" as const,
      xAt: (t: number) => innerLeft + t * (innerRight - innerLeft),
      yAt: () => top
    },
    {
      start: corners[1],
      end: corners[2],
      angle: 90,
      side: "right" as const,
      xAt: () => right,
      yAt: (t: number) => innerTop + t * (innerBottom - innerTop)
    },
    {
      start: corners[2],
      end: corners[3],
      angle: 180,
      side: "bottom" as const,
      xAt: (t: number) => innerRight - t * (innerRight - innerLeft),
      yAt: () => bottom
    },
    {
      start: corners[3],
      end: corners[0] + tileCount,
      angle: 270,
      side: "left" as const,
      xAt: () => left,
      yAt: (t: number) => innerBottom - t * (innerBottom - innerTop)
    }
  ];
  const cornerPointMap: Record<number, { x: number; y: number }> = {
    [corners[0]]: { x: left, y: top },
    [corners[1]]: { x: right, y: top },
    [corners[2]]: { x: right, y: bottom },
    [corners[3]]: { x: left, y: bottom }
  };

  for (let index = 0; index < tileCount; index += 1) {
    const sideDef = sideDefs.find((def) => {
      const normalized = index < corners[0] ? index + tileCount : index;
      return normalized >= def.start && normalized <= def.end;
    }) ?? sideDefs[0];
    const normalized = index < corners[0] ? index + tileCount : index;
    const sideLen = Math.max(1, sideDef.end - sideDef.start);
    const sideSlot = normalized - sideDef.start;
    const t = sideLen <= 0 ? 0 : sideSlot / sideLen;
    const isCorner = corners.includes(index);
    const size = Math.max(26, (isCorner ? corner : edge) - gap);
    const cornerPoint = cornerPointMap[index];
    const x = isCorner && cornerPoint ? cornerPoint.x : sideDef.xAt(t);
    const y = isCorner && cornerPoint ? cornerPoint.y : sideDef.yAt(t);
    points.push({
      x,
      y,
      w: size,
      h: size,
      angle: sideDef.angle,
      isCorner,
      side: sideDef.side
    });
  }

  return {
    boardScale,
    points
  };
}
