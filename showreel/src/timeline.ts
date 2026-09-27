// Beat-based timeline, converted to frames with the composition's fps.
import raw from "./timeline.json";

export const FPS = raw.fps;
export const BPM = raw.bpm;
/** Frames per beat, derived from fps and tempo (30 at 60 fps / 120 BPM). */
export const BEAT = (FPS * 60) / BPM;
export const DURATION = Math.round(raw.beats * BEAT);
export const WIDTH = raw.width;
export const HEIGHT = raw.height;

/** Beat -> frame. */
export const fr = (beat: number) => Math.round(beat * BEAT);

type SceneId = keyof typeof raw.scenes;
export const SCENES = Object.fromEntries(
  Object.entries(raw.scenes).map(([k, [a, b]]) => [k, { from: fr(a), to: fr(b) }]),
) as Record<SceneId, { from: number; to: number }>;

const cue = raw.cues;
const frs = (xs: number[]) => xs.map(fr);

/** Every sync point in the reel, in frames. */
export const T = {
  ballImpacts: frs(cue.ballImpacts),
  periodLand: fr(cue.periodLand),
  zoom: frs(cue.zoom) as [number, number],
  drop: fr(cue.drop),
  morphs: frs(cue.morphs),
  wipes: frs(cue.wipes),
  starSpin: fr(cue.starSpin),
  extrude: fr(cue.extrude),
  slam: fr(cue.slam),
  pulses: frs(cue.pulses),
  liftoff: fr(cue.liftoff),
  burst: fr(cue.burst),
  condense: frs(cue.condense) as [number, number],
  liquid: fr(cue.liquid),
  split: fr(cue.split),
  orbit: fr(cue.orbit),
  bounce: fr(cue.bounce),
  merge: fr(cue.merge),
  pullout: frs(cue.pullout) as [number, number],
  cellsIn: frs(cue.cellsIn) as [number, number],
  collapse: frs(cue.collapse) as [number, number],
  logoHit: fr(cue.logoHit),
  logoPeriod: fr(cue.logoPeriod),
  logoSettle: frs(cue.logoSettle),
  tagline: fr(cue.tagline),
  end: fr(cue.end),
};

export const LABELS = raw.labels.map((l, i) => ({ at: fr(l.at), text: l.text, index: i + 1 }));
