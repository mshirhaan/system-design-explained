/**
 * Isometric geometry for Paper Isometrics.
 * World point (X, Y, Z) lands on screen at x = X - Y, y = (X + Y) / 2 - Z (2:1 projection).
 */
export type Pt = { x: number; y: number };
export const P = (x: number, y: number): Pt => ({ x, y });

export const f = (n: number) => Math.round(n * 100) / 100;

export function toward(p: Pt, q: Pt, d: number): Pt {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  return P(p.x + (dx / len) * d, p.y + (dy / len) * d);
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Polygon path with every corner rounded by a quadratic curve. r: one radius or one per vertex. */
export function rounded(pts: Pt[], r: number | number[], closed = true): string {
  let d = "";
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const ri = Array.isArray(r) ? r[i] : r;
    if ((!closed && (i === 0 || i === n - 1)) || !ri) {
      d += `${i ? "L" : "M"}${f(p.x)},${f(p.y)} `;
      continue;
    }
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const p1 = toward(p, a, Math.min(ri, dist(a, p) / 2));
    const p2 = toward(p, b, Math.min(ri, dist(b, p) / 2));
    d += `${i ? "L" : "M"}${f(p1.x)},${f(p1.y)} Q${f(p.x)},${f(p.y)} ${f(p2.x)},${f(p2.y)} `;
  }
  return d + (closed ? "Z" : "");
}

/** Corners of an isometric box whose base footprint is centred on (cx, cy). */
export function boxCorners(cx: number, cy: number, w: number, d: number, h: number) {
  const c = (X: number, Y: number, Z: number) => P(cx + X - Y, cy + (X + Y) / 2 - Z);
  const hw = w / 2;
  const hd = d / 2;
  return {
    T: c(-hw, -hd, h),
    R: c(hw, -hd, h),
    B: c(hw, hd, h),
    L: c(-hw, hd, h),
    Rb: c(hw, -hd, 0),
    Bb: c(hw, hd, 0),
    Lb: c(-hw, hd, 0),
    top: P(cx, cy - h),
  };
}

/** SVG transform that maps local (u, v) onto the top (floor) plane. u runs along +X, v along +Y. */
export const topPlane = (x: number, y: number) => `matrix(1 0.5 -1 0.5 ${f(x)} ${f(y)})`;
/** Vertical plane facing front-left: u runs along +X (right-down), v is screen-down. */
export const planeX = (x: number, y: number) => `matrix(1 0.5 0 1 ${f(x)} ${f(y)})`;
/** Vertical plane facing front-right: u runs along -Y (right-up), v is screen-down. */
export const planeY = (x: number, y: number) => `matrix(1 -0.5 0 1 ${f(x)} ${f(y)})`;

/** A path through points where every hop arcs upwards a little, like a packet hopping. */
export function hopPath(points: Pt[], lift = 18): string {
  let d = `M${f(points[0].x)},${f(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - lift;
    d += ` Q${f(mx)},${f(my)} ${f(b.x)},${f(b.y)}`;
  }
  return d;
}
