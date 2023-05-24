interface Point {
  x: number;
  y: number;
}

interface LineSegment {
  start: Point;
  end: Point;
}

interface Line {
  point: Point;
  direction: Point;
}

function intersectLineSegmentAndLine(
  segment: LineSegment,
  line: Line
): Point | undefined {
  const { start: a, end: b } = segment;
  const { point: c, direction: d } = line;

  // 線分ABの方向ベクトルを計算
  const ab = { x: b.x - a.x, y: b.y - a.y };

  // 線分ABと直線CDの方向ベクトルの外積を計算
  const abcdCross = ab.x * d.y - ab.y * d.x;

  // 線分ABと直線CDが平行な場合
  if (abcdCross === 0) {
    return undefined;
  }

  // 線分ABと直線CDの交点の位置を計算
  const t = ((c.x - a.x) * d.y - (c.y - a.y) * d.x) / abcdCross;
  const intersectionX = c.x + d.x * t;
  const intersectionY = c.y + d.y * t;

  // 交点の座標を返す
  return { x: intersectionX, y: intersectionY };
}
