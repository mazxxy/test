import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { noise3D } from "@remotion/noise";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { theme } from "../theme";
import { SCENES, T, WIDTH, HEIGHT } from "../timeline";
import { clamp, lerp, prog, sp } from "../lib/anim";
import { inside, Pt, starVerts } from "../lib/shapes";

const C = theme.colors;
// Render-quality knobs (benchmarking only; defaults are the shipping settings).
const Q = { shadows: true, aa: true, seg: 2, shadowMap: 2048, envPins: false, lambert: true, pinH: 1.6, ...((getInputProps() as { q?: object }).q ?? {}) } as {
  shadows: boolean;
  aa: boolean;
  seg: number;
  shadowMap: number;
  envPins: boolean;
  lambert: boolean;
  pinH: number;
};

// --- Star: the 2D morph star, extruded. Units = shape units (250 px at the face-on distance).
const DEPTH = 0.42;
const BEVEL_T = 0.07;
const BEVEL_S = 0.05;
const HALF_T = DEPTH / 2 + BEVEL_T;
const FOV = 30;
// Distance at which 1 unit spans 250 px on a 1080 px tall frame, measured to the widest outline.
const FACE_DIST = HEIGHT / 250 / (2 * Math.tan(((FOV / 2) * Math.PI) / 180));
const CAM_A = { pos: new THREE.Vector3(0, 0, FACE_DIST + DEPTH / 2), target: new THREE.Vector3(0, 0, 0) };

// --- Pin field.
const FIELD_Y = -2.4;
const PITCH = 0.34;
const HALF_N = 21;
const PIN_H = Q.pinH;

/** Star outline in y-up coordinates, inset by the bevel so the bevelled silhouette matches 2D. */
const starOutline = (inset: number): Pt[] => {
  // Flipping y turns the screen-clockwise outline clockwise in y-up space too, so the
  // interior lies to the RIGHT of each edge: inward normal of (dx, dy) is (dy, -dx).
  const v = starVerts().map(([x, y]) => [x, -y] as Pt);
  return v.map((p, i) => {
    const a = v[(i - 1 + v.length) % v.length];
    const b = v[(i + 1) % v.length];
    const n1 = [p[1] - a[1], -(p[0] - a[0])];
    const n2 = [b[1] - p[1], -(b[0] - p[0])];
    const l1 = Math.hypot(n1[0], n1[1]);
    const l2 = Math.hypot(n2[0], n2[1]);
    const u1 = [n1[0] / l1, n1[1] / l1];
    const u2 = [n2[0] / l2, n2[1] / l2];
    const k = 1 + u1[0] * u2[0] + u1[1] * u2[1];
    return [p[0] + (inset * (u1[0] + u2[0])) / k, p[1] + (inset * (u1[1] + u2[1])) / k] as Pt;
  });
};

const STAR_Y_UP = starVerts().map(([x, y]) => [x, -y] as Pt);

/** Everything that moves, as pure functions of the frame. */
const starMotion = (f: number) => {
  const yRest = FIELD_Y + HALF_T - 0.12;
  const hover = prog(f, T.extrude, T.slam - 8, theme.ease.inOut);
  const fall = prog(f, T.slam - 8, T.slam, theme.ease.inCubic);
  let y = lerp(0, -0.9, hover);
  y = lerp(y, yRest, fall);
  // Rebound hops after the slam and on each pulse.
  const since = f - T.slam;
  if (since > 0) y += 0.2 * Math.exp(-since / 7) * Math.abs(Math.sin(since * 0.33));
  for (const p of T.pulses) {
    const s = f - p;
    if (s > 0) y += 0.07 * Math.exp(-s / 5) * Math.abs(Math.sin(s * 0.45));
  }
  const lift = prog(f, T.liftoff, SCENES.three.to - 1, theme.ease.inOut);
  y = lerp(y, 0, lift);
  const tilt = prog(f, T.extrude + 2, T.slam - 4, theme.ease.inOut) * (1 - prog(f, T.liftoff + 3, SCENES.three.to - 2, theme.ease.inOut));
  const yawDeg =
    120 * prog(f, T.extrude, T.slam, theme.ease.out) +
    0.12 * clamp(f - T.slam, 0, T.liftoff - T.slam) +
    lerp(0, 60 - 0.12 * (T.liftoff - T.slam), prog(f, T.liftoff, SCENES.three.to - 2, theme.ease.inOut));
  // "Physicality": flat emissive 2D look at both ends, glossy lit plastic in between.
  // Shading returns to flat emissive for the 2D handoffs. Gloss (specular, clearcoat) leaves
  // first, before the face turns toward the camera, or the key light floods it white.
  const phys = prog(f, T.extrude + 2, T.extrude + 18, theme.ease.inOut) * (1 - prog(f, T.liftoff + 9, SCENES.three.to - 2, theme.ease.inOut));
  const gloss = prog(f, T.extrude + 6, T.extrude + 22, theme.ease.inOut) * (1 - prog(f, T.liftoff - 1, T.liftoff + 9, theme.ease.inOut));
  return { y, tilt, yaw: (yawDeg * Math.PI) / 180, phys, gloss, yRest };
};

const cameraAt = (f: number) => {
  const target = new THREE.Vector3(0, FIELD_Y + 0.05, 0);
  const theta = ((18 + 22 * prog(f, T.slam - 2, T.liftoff, theme.ease.inOutSine)) * Math.PI) / 180;
  const phi = (38 * Math.PI) / 180;
  const rho = 9.4;
  const posB = new THREE.Vector3(
    target.x + rho * Math.sin(theta) * Math.cos(phi),
    target.y + rho * Math.sin(phi),
    target.z + rho * Math.cos(theta) * Math.cos(phi),
  );
  const toB = prog(f, T.extrude, T.slam - 2, theme.ease.inOut);
  const toA = prog(f, T.liftoff, SCENES.three.to - 1, theme.ease.inOut);
  const w = toB * (1 - toA);
  const pos = CAM_A.pos.clone().lerp(posB, w);
  const tgt = CAM_A.target.clone().lerp(target, w);
  // Impact shake: fast, decaying, noise-driven.
  const sh = 0.11 * Math.exp(-Math.max(0, f - T.slam) / 7) * (f >= T.slam ? 1 : 0);
  pos.x += sh * noise3D("shx", f * 0.35, 0, 0);
  pos.y += sh * noise3D("shy", f * 0.35, 0, 0);
  return { pos, tgt };
};

const CameraRig: React.FC = () => {
  const f = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    const { pos, tgt } = cameraAt(f);
    camera.fov = FOV;
    camera.near = 0.1;
    camera.far = 60;
    camera.position.copy(pos);
    camera.lookAt(tgt);
    camera.updateProjectionMatrix();
  });
  return null;
};

const Environment: React.FC = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    if (Q.envPins) {
      scene.environment = env;
      scene.environmentIntensity = 0.55;
    } else {
      scene.userData.env = env;
      scene.traverse((o) => {
        const mm = (o as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined;
        if (mm && (mm as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) {
          mm.envMap = env;
          mm.needsUpdate = true;
        }
      });
    }
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

const Star: React.FC = () => {
  const f = useCurrentFrame();
  const geo = useMemo(() => {
    const outline = starOutline(BEVEL_S);
    const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL_T,
      bevelSize: BEVEL_S,
      bevelSegments: 6,
    });
    g.translate(0, 0, -DEPTH / 2);
    g.computeVertexNormals();
    return g;
  }, []);
  const m = starMotion(f);
  const orange = new THREE.Color(C.orange);
  // Albedo a touch darker than the brand orange: under the key light it reads as the brand colour.
  const orangeLit = orange.clone().multiplyScalar(0.62);
  const black = new THREE.Color(C.black);
  return (
    <group position={[0, m.y, 0]} rotation={[-Math.PI / 2 * m.tilt, 0, 0]}>
      {/* 1.05: three clamps bevel miters at sharp tips, so the raw extrusion reads 5% small */}
      <mesh geometry={geo} rotation={[0, 0, m.yaw]} scale={1.05} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={black.clone().lerp(orangeLit, m.phys)}
          emissive={orange}
          emissiveIntensity={lerp(1, 0.16, m.phys)}
          roughness={0.32}
          metalness={0}
          specularIntensity={m.gloss}
          clearcoat={m.gloss}
          clearcoatRoughness={0.1}
          envMapIntensity={m.gloss * 1.1}
        />
      </mesh>
    </group>
  );
};

type Pin = { x: number; z: number; d: number; shade: number };

const Pins: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new RoundedBoxGeometry(PITCH * 0.84, PIN_H, PITCH * 0.84, Q.seg, 0.045), []);
  const pins = useMemo(() => {
    const out: Pin[] = [];
    for (let i = -HALF_N; i <= HALF_N; i++) {
      for (let j = -HALF_N; j <= HALF_N; j++) {
        const x = i * PITCH;
        const z = j * PITCH;
        out.push({ x, z, d: Math.hypot(x, z), shade: (i + j) % 2 === 0 ? 1 : 0.86 });
      }
    }
    return out;
  }, []);
  const m = starMotion(f);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const mat = new THREE.Matrix4();
    const col = new THREE.Color();
    const base = new THREE.Color(C.graphite);
    const crestCol = new THREE.Color(C.paper);
    const heat = new THREE.Color(C.orange);
    const resting = f >= T.slam && f < T.liftoff + 2;
    const cosY = Math.cos(-m.yaw);
    const sinY = Math.sin(-m.yaw);
    const starBottom = m.y - HALF_T;
    const release = sp(f, T.liftoff + 2, theme.spring.bouncy);
    const waves = [
      { at: T.slam, a: 0.55, c: 6.2 },
      ...T.pulses.map((p) => ({ at: p, a: 0.17, c: 7 })),
    ];
    pins.forEach((p, idx) => {
      // Build: pins rise out of the dark in a wave from the centre.
      const rise = sp(f, T.extrude + 4 + p.d * 1.5, theme.spring.smooth);
      let top = FIELD_Y + 0.04 * noise3D("pin", p.x * 0.35, p.z * 0.35, f * 0.012);
      let crest = 0;
      for (const w of waves) {
        const t = (f - w.at) / 60;
        if (t <= 0) continue;
        const u = p.d - 1.05 - w.c * t;
        const env = Math.exp(-(u * u) / (2 * 0.5 * 0.5));
        const h = w.a * Math.exp(-1.5 * t) * env * Math.cos(2.4 * u);
        top += h;
        crest = Math.max(crest, clamp(h / 0.22));
      }
      // Crater: pins under the resting star are pressed down to its underside,
      // then spring back when it lifts off.
      const lx = p.x * cosY - -p.z * sinY;
      const ly = p.x * sinY + -p.z * cosY;
      const under = inside([lx, ly], STAR_Y_UP);
      if (under && f >= T.slam) {
        const pressed = Math.min(top, starBottom - 0.02);
        top = resting ? pressed : lerp(pressed, top, release);
      }
      top = lerp(FIELD_Y - PIN_H - 1, top, rise);
      // Before the handoff the whole stage drops out of frame, far pins first.
      top -= 3.2 * prog(f, T.liftoff + 4 + (6 - Math.min(6, p.d)) * 0.8, SCENES.three.to - 4, theme.ease.inCubic);
      mat.makeTranslation(p.x, top - PIN_H / 2, p.z);
      mesh.setMatrixAt(idx, mat);
      // Warm spill near the star, bright crests on the shockwave.
      const glow = m.phys * Math.exp(-p.d / 1.1) * (f >= T.slam ? 0.3 : 0.08);
      col.copy(base).multiplyScalar(p.shade).lerp(crestCol, crest * 0.62).lerp(heat, clamp(glow));
      mesh.setColorAt(idx, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, pins.length]} castShadow receiveShadow frustumCulled={false}>
      {Q.lambert ? <meshLambertMaterial /> : <meshStandardMaterial roughness={0.42} metalness={0.12} envMapIntensity={0.7} />}
    </instancedMesh>
  );
};

const Lights: React.FC = () => {
  const f = useCurrentFrame();
  const m = starMotion(f);
  const flash = f >= T.slam ? Math.exp(-(f - T.slam) / 9) : 0;
  return (
    <>
      <ambientLight intensity={0.28} />
      <directionalLight
        position={[-5, 9, 6]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={Q.shadowMap}
        shadow-mapSize-height={Q.shadowMap}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[3, 4, -9]} color={C.rimLight} intensity={1.5} />
      <pointLight position={[0, m.y - HALF_T - 0.25, 0]} color={C.orange} intensity={m.phys * (3 + 26 * flash)} distance={3.6} decay={2} />
    </>
  );
};

export const S3ThreeD: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <ThreeCanvas width={WIDTH} height={HEIGHT} flat shadows={Q.shadows} gl={{ antialias: Q.aa }} camera={{ fov: FOV, position: [0, 0, 8] }}>
        <color attach="background" args={[C.ink]} />
        <fog attach="fog" args={[C.ink, 10, 24]} />
        <Environment />
        <CameraRig />
        <Lights />
        <Star />
        <Pins />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
