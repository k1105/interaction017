interface Point {
  x: number;
  y: number;
}

interface LineSegment {
  start: Point;
  end: Point;
}

export const intersectLineSegments = (seg0: LineSegment, seg1: LineSegment) => {
  const { start: a, end: b } = seg0;
  const { start: c, end: d } = seg1;

  const isIntersect =
    ((a.x - b.x) * (c.y - a.y) - (a.y - b.y) * (c.x - a.x)) *
      ((a.x - b.x) * (d.y - a.y) - (a.y - b.y) * (d.x - a.x)) <=
      0 &&
    ((c.x - d.x) * (a.y - c.y) - (c.y - d.y) * (a.x - c.x)) *
      ((c.x - d.x) * (b.y - c.y) - (c.y - d.y) * (b.x - c.x)) <=
      0; //交差判定

  return isIntersect;

  // if (isIntersect) {
  //   const a1 = b.y - a.y;
  //   const b1 = a.x - b.x;
  //   const c1 = a.y * b.x - a.x * b.y;
  //   const a2 = d.y - c.y;
  //   const b2 = c.x - d.x;
  //   const c2 = c.y * d.x - c.x * d.y;
  //   const int_x = (b1 * c2 - b2 * c1) / (a1 * b2 - a2 * b1);
  //   const k = (int_x - c.x) / d.x;
  //   return k;
  // } else {
  //   return undefined;
  // }
};
