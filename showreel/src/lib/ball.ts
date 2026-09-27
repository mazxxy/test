// Ballistic ball with real contact: every hop is a true parabola under one constant
// gravity, and every contact lasts CONTACT frames, during which the ball compresses
// against the surface and springs back. Squash in contact, stretch along velocity in flight.

export type BallKey = {
  /** Frame at which the ball is maximally compressed against the surface. */
  f: number;
  x: number;
  /** Surface height (screen y of the top of whatever the ball hits). */
  surface: number;
};

export type BallState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Ellipse radii scale along/perpendicular to `angle`. */
  sAlong: number;
  sPerp: number;
  angle: number;
  /** 0..1 compression while in contact. */
  squash: number;
  /** Index of the key whose contact is active, or -1. */
  contactIndex: number;
};

export const CONTACT = 4; // frames of contact (2 in, 2 out)
const HALF = CONTACT / 2;
const MAX_SQUASH = 0.42;
const LAND_SQUASH = 0.38;

export const makeBall = (keys: BallKey[], r: number, g: number, start: { f: number; x: number; y: number }) => {
  // Flight segments run between contact releases/arrivals.
  type Seg = { f0: number; f1: number; x0: number; x1: number; y0: number; y1: number; v0: number };
  const segs: Seg[] = [];
  let prev = { f: start.f, x: start.x, y: start.y };
  for (const k of keys) {
    const f1 = k.f - HALF;
    const y1 = k.surface - r;
    const T = f1 - prev.f;
    // Solve y(t) = y0 + v0 t + g t^2 / 2 through both endpoints.
    const v0 = (y1 - prev.y) / T - 0.5 * g * T;
    segs.push({ f0: prev.f, f1, x0: prev.x, x1: k.x, y0: prev.y, y1, v0 });
    prev = { f: k.f + HALF, x: k.x, y: k.surface - r };
  }

  const state = (f: number): BallState => {
    // In contact?
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const isLast = i === keys.length - 1;
      if (f >= k.f - HALF && (f <= k.f + HALF || isLast)) {
        const t = (f - (k.f - HALF)) / CONTACT; // 0..1 across contact
        // The final landing does not release: it settles with a damped jelly wobble
        // (negative q = briefly taller than round).
        const q =
          isLast && f > k.f
            ? LAND_SQUASH * Math.exp(-(f - k.f) / 4.5) * Math.cos((f - k.f) * 0.42)
            : (isLast ? LAND_SQUASH : MAX_SQUASH) * Math.sin(Math.PI * Math.min(1, t));
        return {
          x: k.x,
          y: k.surface - r * (1 - q),
          vx: 0,
          vy: 0,
          sAlong: 1 - q,
          sPerp: 1 + 0.8 * q,
          angle: 90, // compress vertically
          squash: q,
          contactIndex: i,
        };
      }
    }
    // In flight.
    const s = segs.find((sg) => f >= sg.f0 && f < sg.f1) ?? segs[0];
    const T = s.f1 - s.f0;
    const t = Math.min(Math.max(f - s.f0, 0), T);
    // Horizontal motion of a projectile is uniform: this is physics, not an easing choice.
    const vx = (s.x1 - s.x0) / T;
    const x = s.x0 + vx * t;
    const y = s.y0 + s.v0 * t + 0.5 * g * t * t;
    const vy = s.v0 + g * t;
    const speed = Math.hypot(vx, vy);
    const k = 0.3 * Math.min(1, Math.max(0, (speed - 7) / 22));
    return {
      x,
      y,
      vx,
      vy,
      sAlong: 1 + k,
      sPerp: 1 - 0.45 * k,
      angle: (Math.atan2(vy, vx) * 180) / Math.PI,
      squash: 0,
      contactIndex: -1,
    };
  };

  return { state, segs };
};
