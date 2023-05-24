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

export const intersectLineSegmentAndLine = (
  segment: LineSegment,
  line: Line
) => {
  const { start: a, end: b } = segment;
  const { point: c, direction: d } = line;

  const e = { x: d.x + c.x, y: d.y + c.y };

  const isIntersect =
    ((a.x - b.x) * (c.y - a.y) - (a.y - b.y) * (c.x - a.x)) *
      ((a.x - b.x) * (e.y - a.y) - (a.y - b.y) * (e.x - a.x)) <=
      0 &&
    ((c.x - e.x) * (a.y - c.y) - (c.y - e.y) * (a.x - c.x)) *
      ((c.x - e.x) * (b.y - c.y) - (c.y - e.y) * (b.x - c.x)) <=
      0; //交差判定

  if (isIntersect) {
    const a1 = b.y - a.y;
    const b1 = a.x - b.x;
    const c1 = a.y * b.x - a.x * b.y;
    const a2 = e.y - c.y;
    const b2 = c.x - e.x;
    const c2 = c.y * e.x - c.x * e.y;
    const int_x = (b1 * c2 - b2 * c1) / (a1 * b2 - a2 * b1);
    const k = (int_x - c.x) / d.x;
    return k;
  } else {
    return undefined;
  }
};
