# Claude: Motion Design Reel

A 15-second showreel, 1920 x 1080 at 60 fps, with a synthesized soundtrack. It works like a résumé:
each shot demonstrates one motion design skill, and the HUD in the corner ticks through them
(`01 / 08 SQUASH & STRETCH` ... `08 / 08 IDENTITY`). The whole piece plays as one continuous
move: every scene hands its hero shape to the next one.

**Watch:** [`showreel.mp4`](showreel.mp4) · stills: [`contact-sheet.png`](contact-sheet.png)

## Shot list

| time | skill | what happens |
|---|---|---|
| 0.0-3.0 s | Squash & stretch, kinetic type | An orange ball bounces word to word. Each hop is a true parabola under one gravity, each contact holds a 4-frame squash, and every word it lands on dips like a trampoline and swells from thin/condensed to heavy on Roboto Flex's `wght` and `wdth` axes. The ball's path is left behind as an animator's spacing chart (dots every 2 frames, keyframe diamonds at contacts). It lands as the period of "I make things move." and the camera dives through it. |
| 3.0-5.0 s | Shape morphing | Inside the period: circle, square, triangle, star, one per beat, drawn like a live vector editor (anchors, bezier handles, a rotating selection box, W/H/angle readouts), with echo trails and radial colour wipes. |
| 5.0-7.0 s | 3D & lighting | The 2D star extrudes into glossy 3D (three.js), slams into a field of 1,849 instanced pins and sends a shockwave through them. It returns face-on, matched to the pixel with the 2D star. |
| 7.0-8.5 s | Particle sim | The star shatters into 14,000 particles: burst, curl-noise flow, a spiral vortex that collapses into a disc. |
| 8.5-10.0 s | Liquid FX | The disc turns into glossy metaballs: split, orbit, squeeze, merge, with stretchy follower droplets. |
| 10.0-12.0 s | Systems & loops | The camera pulls out: the liquid shot is one tile in a wall of twelve loops (UI toggles, bar/line/donut charts, a CSS 3D cube, variable-font type, generative waves, isometric blocks, chat UI, spinner, bouncing ball). The wall collapses into a single orange dot. |
| 12.0-15.0 s | Identity | The dot pops, hops (spacing chart again) and lands as the period of "claude." while the letters swell from hairlines to heavy. "motion designer" and a typed line finish the card. |

## How it is built

- **[Remotion](https://www.remotion.dev)** (React to video). Every value on screen is a pure
  function of the frame number, so any frame renders identically in any order.
- **One timeline for picture and sound.** [`src/timeline.json`](src/timeline.json) holds every
  sync point in beats (120 BPM). The video reads it through [`src/timeline.ts`](src/timeline.ts);
  the soundtrack generator reads the same file, so the audio cannot drift from the picture.
- **One theme.** Palette, fonts, easing curves and spring presets live in [`src/theme.ts`](src/theme.ts).
  Nothing moves linearly: entrances use expo-out curves or springs, camera moves use quint in-out.
- **Hand-offs are measured, not eyeballed.** The 3D camera distance is solved from the field of
  view so the extruded star covers the same pixels as the 2D one (checked to within 4 px), and the
  particle cloud is sampled inside that same outline.
- **Finishing stack on every frame:** background light pools, content, grade, HUD, film grain,
  vignette.

| file | what it is |
|---|---|
| `src/scenes/S1Ball.tsx` ... `S7Logo.tsx` | the seven shots |
| `src/lib/ball.ts` | ballistic ball with contact squash, stretch along velocity |
| `src/lib/shapes.ts` | morphable shapes (resampled outlines with preserved corners) |
| `src/components/Minis.tsx` | the eleven new mini loops on the grid wall |
| `src/components/Hud.tsx` | crop marks, name, timecode, skill ticker, beat indicator |
| `audio/synth.py` | the soundtrack: every drum, bass, chord, riser, whoosh, bloop and tick is synthesized with numpy/scipy |

## Soundtrack

120 BPM in A minor, built around the picture: marimba notes on each bounce of the opening
(A, C, E, G, then the tonic when the ball becomes the period), a drop on the dive into the period,
chord stabs on each morph, a sub boom and pin clatter on the 3D slam, spark crackle on the particle
burst, panned bloops for each droplet, a pop per tile on the grid wall, and the opening motif
resolving when the ball lands in "claude.". Mastered to about -13 LUFS.

## Render it

```bash
npm install
pip install numpy scipy pyloudnorm fonttools brotli pillow   # matplotlib too, for `--plot`
npm run audio        # public/audio/soundtrack.wav (+ out/soundtrack.png with --plot)
npm run three-pass   # caches the 3D scene as images (software WebGL is ~6 s/frame)
npm run render       # picture -> mux -> sync check, writes out/showreel.mp4
```

`npm run render` renders the picture muted, then [`scripts/mux.sh`](scripts/mux.sh) adds the
soundtrack. Encoding the AAC there writes an edit list that skips the encoder's priming samples;
without it the audio plays about 43 ms late. [`scripts/sync_check.py`](scripts/sync_check.py)
then finds the transients in the muxed audio and compares them with the timeline (currently
0 ms off on all twelve cues).

`npm run render:live` renders the 3D scene live instead of from the cache. `npm run studio`
opens the Remotion editor. The render uses the Chromium headless shell from the Playwright
install; set `REMOTION_BROWSER` to point somewhere else.

Review tools: `node scripts/stills.mjs <name> <frames...>` renders single frames plus a labelled
contact sheet (frames can be listed or given as `start-end:step`), `scripts/extract.sh` pulls
frames out of an encoded video, and `python3 scripts/contact_sheet.py out/showreel.mp4` rebuilds
[`contact-sheet.png`](contact-sheet.png).

## Credits

Fonts: Roboto Flex, Instrument Serif and JetBrains Mono, all under the SIL Open Font License
(license texts next to each font in `public/fonts/`).
Remotion is free for individuals and small teams; larger companies need a
[company license](https://www.remotion.dev/license).
