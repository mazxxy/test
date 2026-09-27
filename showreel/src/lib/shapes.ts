// Morphable shapes. Every shape is resampled to N points that start at the top and run
// clockwise, with its true corners kept as exact samples, so any two shapes interpolate
// point-for-point without twisting, and corners stay sharp at rest.

export type Pt = [number, number];
export type Shape = { pts: Pt[]; anchors: number[]; name: string };

export const N = 240;

const polar = (r: number, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
};

/** Resample a closed polygon (first vertex = start point) to N points, keeping vertices. */
const resample = (verts: Pt[], isAnchor: boolean[], name: string): Shape => {
  const n = verts.length;
  const lens = verts.map((v, i) => {
    const w = verts[(i + 1) % n];
    return Math.hypot(w[0] - v[0], w[1] - v[1]);
  });
  const per = lens.reduce((a, b) => a + b, 0);
  // Samples per edge, proportional to length, summing to exactly N.
  const raw = lens.map((l) => (l / per) * N);
  const counts = raw.map((x) => Math.max(1, Math.floor(x)));
  let short = N - counts.reduce((a, b) => a + b, 0);
  const order = raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; short > 0; k = (k + 1) % n, short--) counts[order[k][1]]++;
  const pts: Pt[] = [];
  const anchors: number[] = [];
  verts.forEach((v, i) => {
    const w = verts[(i + 1) % n];
    if (isAnchor[i]) anchors.push(pts.length);
    for (let s = 0; s < counts[i]; s++) {
      const t = s / counts[i];
      pts.push([v[0] + (w[0] - v[0]) * t, v[1] + (w[1] - v[1]) * t]);
    }
  });
  return { pts, anchors, name };
};

export const circle = (r = 1): Shape => ({
  pts: Array.from({ length: N }, (_, i) => polar(r, -90 + (360 * i) / N)),
  anchors: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => (k * N) / 8),
  name: "Ellipse",
});

export const square = (h = 0.9): Shape =>
  resample(
    [
      [0, -h],
      [h, -h],
      [h, h],
      [-h, h],
      [-h, -h],
    ],
    [false, true, true, true, true],
    "Rectangle",
  );

export const regular = (sides: number, r: number, name = "Polygon"): Shape =>
  resample(
    Array.from({ length: sides }, (_, i) => polar(r, -90 + (360 * i) / sides)),
    Array.from({ length: sides }, () => true),
    name,
  );

/** The reel's star. The 3D extrusion and the particle cloud use this same outline. */
export const STAR_POINTS = 6;
export const STAR_OUTER = 1.22;
export const STAR_INNER = 0.62;
export const starVerts = (outer = STAR_OUTER, inner = STAR_INNER, points = STAR_POINTS): Pt[] =>
  Array.from({ length: points * 2 }, (_, i) => polar(i % 2 ? inner : outer, -90 + (180 * i) / points));

export const star = (): Shape =>
  resample(
    starVerts(),
    starVerts().map(() => true),
    "Star",
  );

export const triangle = (): Shape => {
  // Nudged down so its optical centre, not its circumcentre, sits on the artboard centre.
  const t = regular(3, 1.3, "Polygon");
  return { ...t, pts: t.pts.map(([x, y]) => [x, y + 0.16] as Pt) };
};

export const mix = (a: Pt[], b: Pt[], t: number): Pt[] =>
  a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);

export const toPath = (pts: Pt[], s: number, cx: number, cy: number, rotDeg: number) => {
  const a = (rotDeg * Math.PI) / 180;
  const c = Math.cos(a);
  const sn = Math.sin(a);
  let d = "";
  pts.forEach(([x, y], i) => {
    const X = cx + s * (x * c - y * sn);
    const Y = cy + s * (x * sn + y * c);
    d += `${i ? "L" : "M"}${X.toFixed(2)} ${Y.toFixed(2)}`;
  });
  return d + "Z";
};

/** Point-in-polygon (even-odd), for sampling particles inside the star. */
export const inside = (p: Pt, poly: Pt[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
