"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/*  Types, constants, helpers                                                  */
/* -------------------------------------------------------------------------- */

type V3 = [number, number, number];

const COLORS = {
  hoodie: "#14234a",
  trousers: "#0b1220",
  skin: "#c68b64",
  hair: "#0a0d14",
  shoe: "#f4f7fb",
  sole: "#cbd5e1",
  rock: "#0d1426",
  laptop: "#0f172a",
  cyan: "#22d3ee",
  sky: "#7dd3fc",
  red: "#dc2626",
};

const MotionContext = createContext<{ reduced: boolean }>({ reduced: false });
const useMotion = () => useContext(MotionContext);

const fract = (x: number) => x - Math.floor(x);
const hash3 = (x: number, y: number, z: number) =>
  fract(
    Math.sin(
      Math.round(x * 500) * 12.9898 +
        Math.round(y * 500) * 78.233 +
        Math.round(z * 500) * 37.719,
    ) * 43758.5453,
  );

/** Clock time that stays at 0 when the user prefers reduced motion. */
function useTime() {
  const { reduced } = useMotion();
  return (elapsed: number) => (reduced ? 0 : elapsed);
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* -------------------------------------------------------------------------- */
/*  Procedural textures                                                        */
/* -------------------------------------------------------------------------- */

function glassPanel(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "rgba(14,34,72,0.86)");
  g.addColorStop(1, "rgba(10,24,54,0.74)");
  ctx.beginPath();
  ctx.roundRect(6, 6, w - 12, h - 12, 34);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(125,211,252,0.85)";
  ctx.stroke();
  // top sheen
  const s = ctx.createLinearGradient(0, 0, 0, h * 0.4);
  s.addColorStop(0, "rgba(255,255,255,0.18)");
  s.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.roundRect(10, 10, w - 20, h * 0.4, 30);
  ctx.fillStyle = s;
  ctx.fill();
}

function drawCodeLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
) {
  const rows: Array<[number, number, string]> = [
    [0, 0.5, COLORS.sky],
    [1, 0.78, "#e0f2fe"],
    [1, 0.42, COLORS.sky],
    [2, 0.66, "#e0f2fe"],
    [2, 0.3, "#fecaca"], // red highlight row
    [1, 0.55, COLORS.sky],
    [0, 0.36, "#e0f2fe"],
  ];
  rows.forEach(([indent, len, color], i) => {
    const yy = y + i * lineH;
    const xx = x + indent * 34;
    if (color === "#fecaca") {
      ctx.fillStyle = "rgba(239,68,68,0.28)";
      ctx.beginPath();
      ctx.roundRect(x - 10, yy - 9, maxW + 20, lineH - 2, 8);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
    } else {
      ctx.fillStyle = color;
    }
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.roundRect(xx, yy, (maxW - indent * 34) * len, 11, 5);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

type PanelKind = "code" | "cap" | "chart";

function makePanelTexture(kind: PanelKind) {
  const w = 512;
  const h = 360;
  const { canvas, ctx } = makeCanvas(w, h);
  glassPanel(ctx, w, h);

  if (kind === "code") {
    // window dots
    [
      ["#ef4444", 46],
      ["#e2e8f0", 74],
      ["#94a3b8", 102],
    ].forEach(([c, x]) => {
      ctx.fillStyle = c as string;
      ctx.beginPath();
      ctx.arc(x as number, 52, 9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(125,211,252,0.35)";
    ctx.fillRect(34, 76, w - 68, 2);
    drawCodeLines(ctx, 48, 112, w - 120, 33);
  }

  if (kind === "cap") {
    const glow = ctx.createRadialGradient(256, 150, 10, 256, 150, 150);
    glow.addColorStop(0, "rgba(34,211,238,0.5)");
    glow.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    // mortarboard
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(256, 92);
    ctx.lineTo(376, 142);
    ctx.lineTo(256, 192);
    ctx.lineTo(136, 142);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#bae6fd";
    ctx.beginPath();
    ctx.moveTo(190, 172);
    ctx.lineTo(190, 216);
    ctx.quadraticCurveTo(256, 258, 322, 216);
    ctx.lineTo(322, 172);
    ctx.lineTo(256, 200);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(366, 147);
    ctx.lineTo(366, 214);
    ctx.stroke();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(366, 220, 9, 0, Math.PI * 2);
    ctx.fill();
    // caption bars
    ctx.fillStyle = "rgba(224,242,254,0.9)";
    ctx.beginPath();
    ctx.roundRect(150, 280, 212, 12, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(125,211,252,0.6)";
    ctx.beginPath();
    ctx.roundRect(190, 306, 132, 10, 5);
    ctx.fill();
  }

  if (kind === "chart") {
    ctx.strokeStyle = "rgba(125,211,252,0.25)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(50, 90 + i * 55);
      ctx.lineTo(w - 50, 90 + i * 55);
      ctx.stroke();
    }
    const bars = [0.25, 0.38, 0.5, 0.66, 0.9];
    bars.forEach((b, i) => {
      const bh = b * 200;
      const x = 66 + i * 82;
      const g = ctx.createLinearGradient(0, 290 - bh, 0, 290);
      g.addColorStop(0, "#67e8f9");
      g.addColorStop(1, "#0ea5e9");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, 290 - bh, 46, bh, 9);
      ctx.fill();
    });
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(84, 232);
    ctx.lineTo(166, 202);
    ctx.lineTo(248, 168);
    ctx.lineTo(330, 132);
    ctx.lineTo(430, 82);
    ctx.stroke();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(430, 82, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  return toTexture(canvas);
}

function makeScreenTexture() {
  const w = 512;
  const h = 320;
  const { canvas, ctx } = makeCanvas(w, h);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#0b1d3f");
  g.addColorStop(1, "#08122b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  drawCodeLines(ctx, 44, 52, w - 110, 34);
  return toTexture(canvas);
}

function makeRadialTexture(stops: Array<[number, string]>) {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size, size);
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(canvas);
}

/* -------------------------------------------------------------------------- */
/*  Floating rock platform                                                     */
/* -------------------------------------------------------------------------- */

function RockPlatform() {
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(2.35, 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n =
        0.55 * hash3(v.x, v.y, v.z) +
        0.45 * (Math.sin(v.x * 1.7 + 1) * Math.sin(v.z * 1.3 + 2) * 0.5 + 0.5);
      v.multiplyScalar(0.86 + 0.28 * n);
      if (v.y > 0) {
        v.y *= 0.1;
      } else {
        const taper = Math.max(0.18, 1 + v.y * 0.24);
        v.x *= taper;
        v.z *= taper;
        v.y *= 1.05;
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={COLORS.rock}
        roughness={0.55}
        metalness={0.25}
        flatShading
        envMapIntensity={1.2}
      />
    </mesh>
  );
}

/* -------------------------------------------------------------------------- */
/*  Student                                                                    */
/* -------------------------------------------------------------------------- */

function Limb({
  from,
  to,
  radius,
  material,
}: {
  from: V3;
  to: V3;
  radius: number;
  material: THREE.Material;
}) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const length = dir.length();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize(),
  );
  const position = a.add(b).multiplyScalar(0.5);
  return (
    <mesh
      position={position}
      quaternion={quaternion}
      material={material}
    >
      <capsuleGeometry args={[radius, Math.max(length - radius * 2, 0.01), 6, 18]} />
    </mesh>
  );
}

function Laptop({ glowRef }: { glowRef: RefObject<THREE.PointLight | null> }) {
  const screenTex = useMemo(() => makeScreenTexture(), []);
  useEffect(() => () => screenTex.dispose(), [screenTex]);

  return (
    <group position={[0, 0.76, 0.62]} rotation={[-0.34, 0, 0]}>
      {/* base */}
      <RoundedBox args={[0.8, 0.045, 0.56]} radius={0.02} smoothness={3}>
        <meshStandardMaterial
          color={COLORS.laptop}
          roughness={0.35}
          metalness={0.7}
          envMapIntensity={1.4}
        />
      </RoundedBox>
      <mesh position={[0, 0.026, -0.02]}>
        <boxGeometry args={[0.7, 0.008, 0.38]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      {/* lid, hinged at the far edge, leaning away from the student */}
      <group position={[0, 0.02, 0.27]} rotation={[0.32, 0, 0]}>
        <RoundedBox
          args={[0.8, 0.52, 0.025]}
          radius={0.012}
          smoothness={3}
          position={[0, 0.26, 0]}
        >
          <meshStandardMaterial
            color="#0b1220"
            roughness={0.3}
            metalness={0.8}
            envMapIntensity={1.5}
          />
        </RoundedBox>
        {/* glowing logo on the lid back */}
        <mesh position={[0, 0.27, 0.0135]}>
          <circleGeometry args={[0.045, 32]} />
          <meshBasicMaterial color="#e0f2fe" toneMapped={false} />
        </mesh>
        {/* screen face, visible when seen from the student's side */}
        <mesh position={[0, 0.26, -0.0135]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.74, 0.46]} />
          <meshBasicMaterial map={screenTex} toneMapped={false} />
        </mesh>
      </group>
      <pointLight
        ref={glowRef}
        position={[0, 0.35, -0.35]}
        color="#38bdf8"
        intensity={2.2}
        distance={2.6}
        decay={2}
      />
    </group>
  );
}

function Student() {
  const t = useTime();
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);

  const mats = useMemo(
    () => ({
      hoodie: new THREE.MeshStandardMaterial({
        color: COLORS.hoodie,
        roughness: 0.88,
      }),
      trousers: new THREE.MeshStandardMaterial({
        color: COLORS.trousers,
        roughness: 0.82,
      }),
      skin: new THREE.MeshStandardMaterial({
        color: COLORS.skin,
        roughness: 0.62,
      }),
      hair: new THREE.MeshStandardMaterial({
        color: COLORS.hair,
        roughness: 0.55,
      }),
      shoe: new THREE.MeshStandardMaterial({
        color: COLORS.shoe,
        roughness: 0.45,
      }),
      sole: new THREE.MeshStandardMaterial({
        color: COLORS.sole,
        roughness: 0.6,
      }),
      eye: new THREE.MeshStandardMaterial({ color: "#0a0d14", roughness: 0.3 }),
    }),
    [],
  );
  useEffect(
    () => () => Object.values(mats).forEach((m) => m.dispose()),
    [mats],
  );

  useFrame((state) => {
    const time = t(state.clock.elapsedTime);
    // typing comes in gentle bursts
    const burst = 0.45 + 0.55 * Math.max(0, Math.sin(time * 0.7));
    if (leftArm.current)
      leftArm.current.rotation.x = Math.sin(time * 9.0) * 0.035 * burst;
    if (rightArm.current)
      rightArm.current.rotation.x = Math.sin(time * 8.0 + 1.7) * 0.035 * burst;
    if (torso.current) torso.current.scale.y = 1 + Math.sin(time * 1.3) * 0.006;
    if (head.current) {
      head.current.rotation.x = 0.22 + Math.sin(time * 0.6) * 0.025;
      head.current.rotation.y = Math.sin(time * 0.4) * 0.05;
    }
    if (glow.current) glow.current.intensity = 2.2 + Math.sin(time * 2.1) * 0.25;
  });

  const forearmEnd: V3 = [0.27, 0.07, 0.55];

  return (
    <group rotation={[0, -0.55, 0]} position={[0, 0.08, 0]}>
      {/* legs */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Limb
            from={[s * 0.18, 0.3, 0.02]}
            to={[s * 0.2, 0.62, 0.95]}
            radius={0.19}
            material={mats.trousers}
          />
          <Limb
            from={[s * 0.2, 0.62, 0.95]}
            to={[s * 0.2, 0.22, 1.72]}
            radius={0.15}
            material={mats.trousers}
          />
          <RoundedBox
            args={[0.26, 0.17, 0.52]}
            radius={0.07}
            smoothness={3}
            position={[s * 0.2, 0.16, 1.88]}
            rotation={[-0.08, 0, 0]}
            material={mats.shoe}
          />
          <mesh position={[s * 0.2, 0.065, 1.88]} material={mats.sole}>
            <boxGeometry args={[0.27, 0.04, 0.54]} />
          </mesh>
        </group>
      ))}

      {/* torso + shoulders + hood */}
      <group ref={torso}>
        <Limb
          from={[0, 0.34, -0.06]}
          to={[0, 1.08, -0.2]}
          radius={0.37}
          material={mats.hoodie}
        />
        <Limb
          from={[-0.4, 1.2, -0.2]}
          to={[0.4, 1.2, -0.2]}
          radius={0.2}
          material={mats.hoodie}
        />
        <mesh
          position={[0, 1.46, -0.22]}
          rotation={[Math.PI / 2.4, 0, 0]}
          material={mats.hoodie}
        >
          <torusGeometry args={[0.25, 0.12, 16, 36]} />
        </mesh>
      </group>

      {/* head */}
      <group ref={head} position={[0, 1.78, -0.1]} rotation={[0.22, 0, 0]}>
        <mesh material={mats.skin}>
          <sphereGeometry args={[0.27, 32, 24]} />
        </mesh>
        <mesh
          position={[0, 0.03, -0.025]}
          rotation={[-0.15, 0, 0]}
          material={mats.hair}
        >
          <sphereGeometry
            args={[0.285, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]}
          />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * 0.09, 0.0, 0.25]}
            material={mats.eye}
          >
            <sphereGeometry args={[0.028, 12, 12]} />
          </mesh>
        ))}
      </group>
      <Limb
        from={[0, 1.4, -0.16]}
        to={[0, 1.6, -0.1]}
        radius={0.1}
        material={mats.skin}
      />

      {/* arms: upper arm fixed, forearm pivots at the elbow to type */}
      {[
        { s: -1, ref: leftArm },
        { s: 1, ref: rightArm },
      ].map(({ s, ref }) => (
        <group key={s}>
          <Limb
            from={[s * 0.42, 1.2, -0.2]}
            to={[s * 0.5, 0.72, 0.15]}
            radius={0.13}
            material={mats.hoodie}
          />
          <group ref={ref} position={[s * 0.5, 0.72, 0.15]}>
            <Limb
              from={[0, 0, 0]}
              to={[-s * forearmEnd[0], forearmEnd[1], forearmEnd[2]]}
              radius={0.115}
              material={mats.hoodie}
            />
            <mesh
              position={[-s * forearmEnd[0], forearmEnd[1], forearmEnd[2]]}
              scale={[1, 0.7, 1.15]}
              material={mats.skin}
            >
              <sphereGeometry args={[0.095, 16, 12]} />
            </mesh>
          </group>
        </group>
      ))}

      <Laptop glowRef={glow} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Portal                                                                     */
/* -------------------------------------------------------------------------- */

function Portal() {
  const t = useTime();
  const root = useRef<THREE.Group>(null);
  const ticks = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);

  const discTex = useMemo(
    () =>
      makeRadialTexture([
        [0, "rgba(186,230,253,0.10)"],
        [0.7, "rgba(125,211,252,0.22)"],
        [1, "rgba(56,189,248,0.42)"],
      ]),
    [],
  );
  const haloTex = useMemo(
    () =>
      makeRadialTexture([
        [0.55, "rgba(56,189,248,0.30)"],
        [1, "rgba(56,189,248,0)"],
      ]),
    [],
  );
  useEffect(
    () => () => {
      discTex.dispose();
      haloTex.dispose();
    },
    [discTex, haloTex],
  );

  const tickMatrices = useMemo(() => {
    const count = 96;
    const m: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 2.38;
      dummy.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      dummy.rotation.set(0, 0, a);
      const long = i % 8 === 0;
      dummy.scale.set(long ? 0.16 : 0.07, long ? 0.028 : 0.018, 0.018);
      dummy.updateMatrix();
      m.push(dummy.matrix.clone());
    }
    return m;
  }, []);

  const instRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = instRef.current;
    if (!mesh) return;
    tickMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [tickMatrices]);

  useFrame((state) => {
    const time = t(state.clock.elapsedTime);
    if (root.current) {
      root.current.rotation.y = -0.22 + Math.sin(time * 0.22) * 0.16;
      root.current.rotation.x = Math.sin(time * 0.18) * 0.03;
    }
    if (ticks.current) ticks.current.rotation.z = time * 0.09;
    if (inner.current) inner.current.rotation.z = -time * 0.05;
  });

  return (
    <group ref={root} position={[0.15, 1.5, -2.7]}>
      <mesh position={[0, 0, -0.06]} renderOrder={-2}>
        <circleGeometry args={[4.0, 64]} />
        <meshBasicMaterial
          map={haloTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh renderOrder={-1}>
        <circleGeometry args={[2.7, 96]} />
        <meshBasicMaterial
          map={discTex}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <torusGeometry args={[2.7, 0.085, 24, 180]} />
        <meshPhysicalMaterial
          color="#d3f0ff"
          emissive={COLORS.cyan}
          emissiveIntensity={0.35}
          roughness={0.1}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.88}
          envMapIntensity={1.6}
        />
      </mesh>
      <mesh ref={inner}>
        <torusGeometry args={[2.22, 0.026, 12, 180]} />
        <meshBasicMaterial color="#e0f7ff" transparent opacity={0.8} toneMapped={false} />
      </mesh>
      <group ref={ticks}>
  <instancedMesh
    ref={instRef}
    args={[undefined, undefined, tickMatrices.length]}
  >
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial
      color="#bae6fd"
      transparent
      opacity={0.85}
      toneMapped={false}
    />
  </instancedMesh>
</group>

</group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Orbital glass ribbon                                                       */
/* -------------------------------------------------------------------------- */

function makeRibbonGeometry() {
  const segments = 240;
  const positions: number[] = [];
  const indices: number[] = [];
  const centre = new THREE.Vector3();
  const next = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const radial = new THREE.Vector3();
  const width = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  const path = (u: number, out: THREE.Vector3) => {
    const a = u * Math.PI * 2;
    const r = 3.05 + 0.3 * Math.sin(a * 2 + 0.4);
    return out.set(
      Math.cos(a) * r,
      0.55 + 0.85 * Math.sin(a + 0.6) + 0.2 * Math.sin(a * 3),
      Math.sin(a) * r * 0.82,
    );
  };

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    path(u, centre);
    path(u + 0.001, next);
    tangent.copy(next).sub(centre).normalize();
    radial.set(centre.x, 0, centre.z).normalize();
    const twist = u * Math.PI * 2 * 1.5 + 0.8;
    width
      .copy(radial)
      .multiplyScalar(Math.sin(twist) * 0.7)
      .addScaledVector(up, Math.cos(twist))
      .addScaledVector(tangent, -width.dot(tangent))
      .normalize();
    const half = 0.17 + 0.07 * Math.sin(u * Math.PI * 2 * 2);
    positions.push(
      centre.x + width.x * half,
      centre.y + width.y * half,
      centre.z + width.z * half,
      centre.x - width.x * half,
      centre.y - width.y * half,
      centre.z - width.z * half,
    );
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function Ribbon() {
  const t = useTime();
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => makeRibbonGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const time = t(state.clock.elapsedTime);
    if (!group.current) return;
    group.current.rotation.y = time * 0.16;
    group.current.rotation.x = 0.1 + Math.sin(time * 0.3) * 0.05;
    group.current.rotation.z = 0.08 + Math.cos(time * 0.25) * 0.03;
  });

  return (
    <group ref={group} position={[0, 0.2, 0]}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color="#8be9ff"
          emissive={COLORS.cyan}
          emissiveIntensity={0.55}
          roughness={0.08}
          metalness={0.1}
          clearcoat={1}
          transparent
          opacity={0.62}
          side={THREE.DoubleSide}
          envMapIntensity={1.8}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Floating UI panels                                                         */
/* -------------------------------------------------------------------------- */

function Panel({
  kind,
  position,
  rotationY,
  scale = 1,
  phase,
}: {
  kind: PanelKind;
  position: V3;
  rotationY: number;
  scale?: number;
  phase: number;
}) {
  const t = useTime();
  const group = useRef<THREE.Group>(null);
  const texture = useMemo(() => makePanelTexture(kind), [kind]);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state) => {
    const time = t(state.clock.elapsedTime);
    if (!group.current) return;
    group.current.position.y = position[1] + Math.sin(time * 0.6 + phase) * 0.12;
    group.current.rotation.y = rotationY + Math.sin(time * 0.35 + phase) * 0.09;
    group.current.rotation.z = Math.sin(time * 0.42 + phase) * 0.045;
    group.current.rotation.x = Math.sin(time * 0.3 + phase * 1.3) * 0.035;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh>
        <planeGeometry args={[1.85, 1.3]} />
        <meshBasicMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}


function LogoPanel({
  position,
  phase,
}: {
  position: V3;
  phase: number;
}) {
  const group = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      "/logo/ASA.jpeg",
      (loadedTexture) => {
        if (!active) {
          loadedTexture.dispose();
          return;
        }

        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.anisotropy = 8;
        loadedTexture.needsUpdate = true;
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error(
          "Failed to load /logo/ASA.jpeg. Check public/logo/ASA.jpeg",
          error,
        );
      },
    );

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => texture?.dispose();
  }, [texture]);

  useFrame((state) => {
    if (!group.current) return;

    // Keep the logo upright and floating, without rotating it.
    group.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.6 + phase) * 0.08;

    group.current.rotation.set(0, 0, 0);
  });

  return (
    <group ref={group} position={position}>
      {/* Cyan outer glow */}
      <mesh position={[0, 0, -0.04]} renderOrder={1000}>
        <planeGeometry args={[2.35, 1.65]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.25}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Bright cyan border */}
      <mesh position={[0, 0, -0.025]} renderOrder={1001}>
        <planeGeometry args={[2.2, 1.5]} />
        <meshBasicMaterial
          color="#38bdf8"
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* White background behind the logo */}
      <mesh position={[0, 0, 0]} renderOrder={1002}>
        <planeGeometry args={[2.08, 1.38]} />
        <meshBasicMaterial
          color="#ffffff"
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Actual Way2Skills logo */}
      {texture && (
        <mesh position={[0, 0, 0.025]} renderOrder={1003}>
          <planeGeometry args={[1.98, 1.28]} />
          <meshBasicMaterial
            map={texture}
            color="#ffffff"
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            transparent={false}
            opacity={1}
          />
        </mesh>
      )}

      {/* Fallback text if the image has not loaded yet */}
      {!texture && (
        <mesh position={[0, 0, 0.03]} renderOrder={1003}>
          <planeGeometry args={[1.98, 1.28]} />
          <meshBasicMaterial
            color="#ffffff"
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Crystals and red spheres                                                   */
/* -------------------------------------------------------------------------- */

const CRYSTALS: Array<{ p: V3; s: number; phase: number }> = [
  { p: [-3.7, 3.0, 0.4], s: 0.2, phase: 0.2 },
  { p: [3.9, 1.5, 0.2], s: 0.16, phase: 1.1 },
  { p: [-3.4, 0.2, 1.4], s: 0.14, phase: 2.2 },
  { p: [1.9, 3.9, -0.6], s: 0.13, phase: 3.1 },
  { p: [3.3, -0.6, 1.6], s: 0.18, phase: 4.0 },
  { p: [-1.6, 3.75, 0.3], s: 0.1, phase: 5.0 },
  { p: [-2.4, -1.1, 1.8], s: 0.11, phase: 5.8 },
];

const RED_SPHERES: Array<{ p: V3; r: number; phase: number }> = [
  { p: [3.65, 3.1, 0.6], r: 0.12, phase: 0.6 },
  { p: [-3.9, 1.4, 1.0], r: 0.085, phase: 2.0 },
  { p: [2.5, -1.6, 1.4], r: 0.07, phase: 3.6 },
];

function Accents() {
  const t = useTime();
  const crystalRefs = useRef<Array<THREE.Mesh | null>>([]);
  const redRefs = useRef<Array<THREE.Mesh | null>>([]);

  useFrame((state) => {
    const time = t(state.clock.elapsedTime);
    CRYSTALS.forEach((c, i) => {
      const m = crystalRefs.current[i];
      if (!m) return;
      m.position.y = c.p[1] + Math.sin(time * 0.55 + c.phase) * 0.1;
      m.position.x = c.p[0] + Math.cos(time * 0.4 + c.phase) * 0.05;
      m.rotation.y = time * 0.25 + c.phase;
      m.rotation.x = Math.sin(time * 0.3 + c.phase) * 0.4;
    });
    RED_SPHERES.forEach((r, i) => {
      const m = redRefs.current[i];
      if (!m) return;
      m.position.y = r.p[1] + Math.sin(time * 0.5 + r.phase) * 0.12;
      m.position.x = r.p[0] + Math.cos(time * 0.35 + r.phase) * 0.07;
    });
  });

  return (
    <>
      {CRYSTALS.map((c, i) => (
        <mesh
          key={`c${i}`}
          ref={(el) => {
            crystalRefs.current[i] = el;
          }}
          position={c.p}
          scale={c.s}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial
            color="#9be4ff"
            emissive="#0ea5e9"
            emissiveIntensity={0.3}
            roughness={0.08}
            metalness={0.15}
            clearcoat={1}
            flatShading
            transparent
            opacity={0.92}
            envMapIntensity={2}
          />
        </mesh>
      ))}
      {RED_SPHERES.map((r, i) => (
        <mesh
          key={`r${i}`}
          ref={(el) => {
            redRefs.current[i] = el;
          }}
          position={r.p}
        >
          <sphereGeometry args={[r.r, 24, 24]} />
          <meshPhysicalMaterial
            color={COLORS.red}
            emissive="#7f1d1d"
            emissiveIntensity={0.35}
            roughness={0.12}
            clearcoat={1}
            envMapIntensity={1.6}
          />
        </mesh>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Composition, camera rig, lighting                                          */
/* -------------------------------------------------------------------------- */

function Composition() {
  const t = useTime();
  const root = useRef<THREE.Group>(null);
  const viewport = useThree((s) => s.viewport);
  const fit = Math.min(viewport.width / 8.6, viewport.height / 7.6, 1.05);

  useFrame((state) => {
    const time = t(state.clock.elapsedTime);
    if (!root.current) return;
    root.current.position.y = -1.0 * fit + Math.sin(time * 0.5) * 0.09;
    root.current.rotation.y = Math.sin(time * 0.23) * 0.05;
  });

  
return (
  <group
    ref={root}
    scale={fit}
    position={[0, -1.0 * fit, 0]}
  >
    <RockPlatform />
    <Student />
    <Portal />
    <Ribbon />

    <LogoPanel
      position={[-3.0, 2.55, 0.9]}
      phase={0.3}
    />

    <Panel
      kind="code"
      position={[-3.0, -0.5, 0.9]}
      rotationY={0.42}
      phase={1.2}
    />

    <Panel
      kind="cap"
      position={[3.05, 3.0, 0.2]}
      rotationY={-0.4}
      scale={0.85}
      phase={2.0}
    />

    <Panel
      kind="chart"
      position={[3.35, 0.45, 1.1]}
      rotationY={-0.5}
      scale={0.95}
      phase={4.1}
    />

    <Accents />
  </group>
);

}

function Rig() {
  const { reduced } = useMotion();
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  useFrame((state, delta) => {
    const time = reduced ? 0 : state.clock.elapsedTime;
    const cam = state.camera;
    const tx = pointer.current.x * 0.7 + Math.sin(time * 0.12) * 0.45;
    const ty = 0.5 - pointer.current.y * 0.3 + Math.sin(time * 0.17) * 0.15;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, tx, 1.6, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, ty, 1.6, delta);
    cam.lookAt(0, 0.1, 0);
  });

  return null;
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#dbeafe", "#0b1220", 0.55]} />
      <directionalLight position={[5, 8, 6]} intensity={2.2} color="#ffffff" />
      <pointLight position={[-4, 2, 3]} intensity={30} color="#38bdf8" distance={14} decay={2} />
      <pointLight position={[0, 1.5, -2]} intensity={22} color="#22d3ee" distance={9} decay={2} />
      {/* Reflections come from in-scene light cards, so no HDR is fetched. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 6, -4]} scale={[12, 4, 1]} color="#dff4ff" />
        <Lightformer form="rect" intensity={1.6} position={[-6, 1, 3]} scale={[3, 8, 1]} color="#7dd3fc" />
        <Lightformer form="rect" intensity={1.2} position={[6, 2, 2]} scale={[3, 8, 1]} color="#ffffff" />
        <Lightformer form="ring" intensity={1.4} position={[0, 2, -6]} scale={6} color="#22d3ee" />
      </Environment>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Public component                                                           */
/* -------------------------------------------------------------------------- */

export interface Hero3DSceneProps {
  /** Pause rendering when the hero is scrolled out of view. */
  active?: boolean;
  /** Called once the first frame has been drawn (used to hide the fallback). */
  onReady?: () => void;
}

function ReadyNotifier({ onReady }: { onReady?: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      onReady?.();
    }
  });
  return null;
}

export default function Hero3DScene({ active = true, onReady }: Hero3DSceneProps) {
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const frameloop: "always" | "demand" | "never" = reduced
    ? "demand"
    : active
      ? "always"
      : "never";

  const content: ReactNode = (
    <MotionContext.Provider value={{ reduced }}>
      <Lighting />
      <Composition />
      <ContactShadows
        position={[0, -3.5, 0]}
        opacity={0.35}
        scale={11}
        blur={2.8}
        far={5}
        resolution={512}
        frames={1}
        color="#0b2a4a"
      />
      <Rig />
      <ReadyNotifier onReady={onReady} />
    </MotionContext.Provider>
  );

  return (
    <Canvas
      className="!absolute inset-0"
      frameloop={frameloop}
      dpr={[1, 1.6]}
      camera={{ position: [0, 0.5, 15], fov: 28, near: 0.1, far: 60 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ background: "transparent" }}
    >
      {content}
    </Canvas>
  );
}
