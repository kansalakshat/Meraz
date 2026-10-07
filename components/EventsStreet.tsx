"use client";

// Events page: Spider-Man (the home page's runner) walks into a night mela — a fairground of striped stalls, yatai,
// a giant wheel and a merry-go-round — with the camera behind him. Scrolling takes him down the row of stalls along
// the fairground's north side: at each he turns to face it and the camera swings round past his shoulder onto the
// stall's back wall, where that category's page hangs. The pages are real HTML (CSS3DRenderer), so their carousels
// and register links work as on the old panels.
// The pages sit in a layer under the WebGL canvas, and each wall is drawn into the canvas as a transparent hole: a
// page shows exactly where its wall is visible, and the stall's poles, the counter and Spider-Man still pass in front.
// Around the street, the mela: the giant wheel and the merry-go-round turning on the clips they came with, fairgoers
// idling and talking, paper lanterns and strings of bulbs lit over the path, fireworks going up under a full moon.
// These, and his idling, run in a frame loop while the scene is on screen.
// Reduced motion (or a failed load) gets the category panels instead.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import { X } from "@phosphor-icons/react";
import { eventCategories, type EventCategory } from "@/data/events";
import { melaModel } from "@/data/site";
import EventsPanels, { Carousel, CategoryContent, tones } from "./EventsPanels";
import { getLenis, jumpScroll } from "./ScrollFx";
import { key as boneKey, soldier, strideSpeed } from "./rig";
import { HAZE, fireworkShows, glowDot, nightSky, skyEnvironment, type Show } from "./night";

gsap.registerPlugin(ScrollTrigger);

// The mela (mela.glb, a carnival cut down at build time from 265 MB to 14 MB) is modelled at 1/S life size, so scaled
// by S it is in metres: a fairgoer in it stands 0.42 of its units tall. Everything below is in the model's own units,
// measured off the file; multiply by S for metres.
const S = 4;
// The street: the stone-paved alley through the middle of the fairground, running east from the circus tent to the
// giant wheel, with yatai down both sides — two bays on the north, three on the south — their counters under lit
// awnings and paper lanterns strung the length of it. He walks it in +x; the wheel and the merry-go-round stand at
// the far end. One stall per category, in eventCategories' order, by the x of its bay: side -1 is the north row,
// +1 the south, so he turns alternately left and right as he goes.
const STALLS: { x: number; side: -1 | 1 }[] = [
  { x: -1.138, side: -1 },
  { x: -1.087, side: 1 },
  { x: -0.653, side: -1 },
  { x: -0.58, side: 1 },
  { x: -0.073, side: 1 },
];
// Each row's back curtain (the red-and-white kohaku behind the counter), and the page hung on it: w wide, from
// bottom (just over the counter top) to top (just under the awning), and off out from the cloth towards the alley,
// so the hole punched for it is drawn in front of the curtain rather than fighting it.
const WALL = { north: -0.54, south: 0.48, off: 0.012, w: 0.355, bottom: 0.195, top: 0.345 };
// The paving runs x -1.59 … 0.38, z -0.32 … 0.30: 2.5 m across. His line is its middle, and the walk starts west of
// it, clear of the circus tent. At a stall he steps stand out of the line towards it, aside further along than its
// bay's middle (so the camera, swinging in to the page from behind him, passes beside him, not through him).
const PATH = { z: -0.01, start: -2, stand: 0.15, aside: 0.17 };
// Scroll: metres walked per screen, and screens spent turning (to a stall and away again) and holding on each page.
const PACE = { metres: 4, turn: 0.5, hold: 0.7, start: 0.15 };
// A stall button's trip, played in time: walking at pace times his natural pace, each turn taking turn seconds.
const TRIP = { pace: 1.6, turn: 0.9 };
const STRIDE = 0.7; // as on the home page: a long stride stretches the dhoti
// Chase camera, metres: behind him along the street, the way he is going (not along his zig-zag, which would swing it
// into the stall he just left), halfway from him to the street's line, at height up above the ground: under the
// lanterns strung over the path. It looks ahead of him, at height aim.
const CHASE = { back: 2, up: 1.6, ahead: 3, aim: 1.3, fov: 45 };
// The turf laid over the fairground: how many times it tiles across each of the ground's texture sheets, and across
// the earth that runs on beyond it.
const GRASS = { repeat: 14, earth: 90 };
// How hard the sky photo lights the mela as an environment map (see skyEnvironment in night.ts).
const ENV_LIGHT = 1.15;
// The shadow map: span metres each way from the middle of the alley (enough for the stalls, their lanterns and the
// trees that lean over them), and the two nudges that keep a low sun from striping flat surfaces with their own
// shadow. A narrow screen gets half the map: it is a phone, and the shadows are small on it anyway.
const SHADOW = { span: 15, bias: -0.0006, normalBias: 0.03, map: 2048, small: 1024 };
// Facing a page: it fills fill.w of the screen's width, or fill.h of its height below the nav bar, whichever is
// smaller. A narrow screen would put the camera out in the street, so it stops max metres out and widens its lens.
const HOLD = { fill: { w: 0.86, h: 0.78 }, max: 3 };
const COMPACT = 720; // pages narrower than this on screen (phones, portrait tablets) show a summary that opens a dialog
// The two rides turn for ever on the clips they came with: the giant wheel (12.5 s) and the merry-go-round (30 s).
const RIDES = [
  { group: "wheel.001", clip: "Take 001" },
  { group: "Sketchfab_model.001", clip: "Take 001.001" },
];
// The two fairgoers that came with Mixamo idles of their own, started apart so the pair does not move as one.
const ACTORS = [
  { group: "Sketchfab_model.007", clip: "mixamo.com", at: 0 },
  { group: "Sketchfab_model.009", clip: "mixamo.com.001", at: 0.8 },
];
// Everyone else in the model stands dead still. These breathe where they stand (see breathe below); the first has a
// Mixamo skeleton, so it also sways, shifts its weight and talks with its head and hands.
const IDLERS = [
  { group: "Sketchfab_model.002", phase: 0 },
  { group: "Sketchfab_model.005", phase: 1.3 },
  { group: "Sketchfab_model.006", phase: 2.1 },
  { group: "Sketchfab_model.008", phase: 3.4 },
  { group: "Sketchfab_model.003", phase: 4.2 },
];
// Lit up for the fest: each of these materials glows with its own texture, where it has one, or else its own colour,
// glow times as bright. The model's own bulbs (denkyu) and the merry-go-round's lamps burn brightest.
const GLOW: Record<string, number> = {
  denkyu: 1,
  surfaceShader3: 0.7,
  "Material.002": 0.85, // the paper lanterns
  Tent: 0.5,
  lambert1: 0.4, // the giant wheel's frame and cars
  yellow_strip: 0.32,
  blue_strip: 0.28,
  red_strip: 0.28,
  tenmaku: 0.22, // the yatai awnings
  material_0: 0.26,
  "material_0.001": 0.3,
  "material_0.004": 0.3,
  "material_0.005": 0.3, // the yatai signs
  horse_white: 0.3,
  Horse_black: 0.22,
  "Material.044": 0.12,
};
// Strings of bulbs, as on a Christmas tree: a ring round the giant wheel's rim and a festoon sagging the length of
// the alley, over the path. Every third bulb is lit in turn, chase times a second.
const BULBS = { size: 0.7, chase: 6, colours: [0xfff1c1, 0xff4fa3, 0x19d3c5, 0xffb627], wheel: 48, sag: 0.02 };
// Fireworks (see night.ts), out past the fairground both ways, so they burst over the stalls whichever way he walks.
const SHOWS: Show[] = [
  { at: [95, -5, -50], scale: 1.1, speed: 2.3, gap: 1.5 },
  { at: [110, -5, 45], scale: 1.2, speed: 2.1, gap: 2.5 },
  { at: [80, -5, 5], scale: 1, speed: 2.4, gap: 1 },
  { at: [-95, -5, 50], scale: 1.1, speed: 2.3, gap: 2 },
  { at: [-110, -5, -45], scale: 1.2, speed: 2.2, gap: 3 },
  { at: [-80, -5, -5], scale: 1, speed: 2.5, gap: 1.5 },
];
// The paper lanterns came lettered 御祭禮 in their texture; they are relettered in Hindi, the words spaced round each
// lantern so one faces every way, in the site's Devanagari face. The lantern's side is the texture's rows 0-300,
// upside down (row 0 is its foot): pink stripes, the old letters in a column at x 440-600 (covered with a clean strip
// of the same stripes from x 100), the new words across the middle at row y, size px tall.
const LANTERN = { words: ["शुभ लाभ", "वार्षिक मेला"], y: 150, size: 110, colour: "#2a0a12" };
// The lines the stalls carry, in walking order round the row and round each sign.
const SIGN_TEXT = ["निशाना लगाइए", "एक मौका, एक इनाम!", "इनाम जीतिए"];
// The yatai signs came lettered in Japanese, each column of it on its own torn-paper banner in the stall's texture
// atlas. Each block below is one of those banners: it is painted out in the banner's own colour (sampled at from) and
// a Hindi line is drawn across it, turned to lie along the banner as the old lettering did. In pixels of the 1024 px
// atlas, so they hold whatever size the texture is served at. The banners of one atlas are all one colour, so a block
// that spills over a torn edge spills onto either the same colour or unused texture, and never shows.
const SIGNS: Record<string, { at: [number, number]; w: number; h: number; turn: number; from: [number, number]; ink: string }[]> = {
  "material_0.005": [
    { at: [474, 158], w: 329, h: 172, turn: -58, from: [300, 450], ink: "#fdf6e8" },
    { at: [652, 238], w: 305, h: 156, turn: -58, from: [300, 450], ink: "#2f7bff" },
    { at: [768, 852], w: 232, h: 112, turn: -8, from: [300, 450], ink: "#2f7bff" },
  ],
  "material_0.004": [
    { at: [470, 146], w: 305, h: 164, turn: -64, from: [250, 450], ink: "#e8231a" },
    { at: [650, 244], w: 305, h: 156, turn: -58, from: [250, 450], ink: "#2f7bff" },
    { at: [778, 862], w: 232, h: 107, turn: -7, from: [250, 450], ink: "#2f7bff" },
  ],
  "material_0.001": [
    { at: [836, 362], w: 268, h: 153, turn: -56, from: [620, 300], ink: "#e8384a" },
    { at: [492, 548], w: 195, h: 94, turn: 22, from: [620, 300], ink: "#4fb8ff" },
    { at: [348, 800], w: 244, h: 130, turn: -32, from: [620, 300], ink: "#e8384a" },
  ],
};
const aspect = WALL.w / (WALL.top - WALL.bottom);
const smooth = (t: number, a = 0, b = 1) => THREE.MathUtils.smoothstep(t, a, b);
const turnTo = (a: number, b: number, t: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t; // the short way round
// GLTFLoader strips dots and the like out of node names; names are matched with both sides flattened the same way.
const flat = (n: string) => n.replace(/[\s.:/[\]]/g, "");
const find = (root: THREE.Object3D, name: string) => {
  const want = flat(name);
  let hit: THREE.Object3D | undefined;
  root.traverse((o) => {
    if (!hit && flat(o.name) === want) hit = o;
  });
  return hit;
};

// heading: the way he faces, chase: the way the chase camera looks (down the street or back up it), both as angles
// of (sin, 0, cos).
type Frame = { pos: THREE.Vector3; heading: number; chase: number; walked: number; walking: number; stall: number; push: number };

export default function EventsStreet() {
  const pin = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const bar = useRef<HTMLElement>(null);
  const jumps = useRef<(HTMLButtonElement | null)[]>([]);
  const goTo = useRef<((k: number) => void) | null>(null); // walks him to stall k, once the scene can
  const [walls, setWalls] = useState<HTMLDivElement[]>([]);
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState<EventCategory | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setFallback(true);
    const el = host.current!;
    const under = layer.current!;
    const sec = pin.current!;
    // The pages' elements: CSS3DRenderer places them, React renders into them (portals below).
    const pages = STALLS.map(() => {
      const d = document.createElement("div");
      d.inert = true;
      return d;
    });
    setWalls(pages);
    let cleanup = () => {};
    let dead = false;

    (async () => {
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      // The sky and the fireworks' shell don't hold up the first frame.
      const skyLoad = new THREE.ImageBitmapLoader().loadAsync("/sky.jpg"); // decoded off the main thread
      skyLoad.catch(() => {}); // reported where it is used
      const shellLoad = fetch("/models/fireworks.bin").then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)));
      shellLoad.catch(() => {}); // reported where it is used
      const [mela, man, walker] = await Promise.all([melaModel, "/models/jump.glb", "/models/walk.glb"].map((url) => loader.loadAsync(url)));
      if (dead) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      // Shadows, as the scene was lit in Blender: one soft-edged map from the lamp standing in for the mela's lights.
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.cssText = "position:absolute;inset:0;pointer-events:none"; // clicks go to the pages under it
      el.appendChild(renderer.domElement);
      const css = new CSS3DRenderer();
      under.appendChild(css.domElement);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(HAZE);
      scene.fog = new THREE.Fog(HAZE, 40, 170); // the far side of the fairground shows, hazy
      const { dome, dispose: disposeSky } = nightSky(skyLoad, null, Math.PI / 2, () => dead); // night sky, no moon over the mela
      const lamp = new THREE.DirectionalLight(0xffd9a0, 2.05); // the moon down the street, and the stalls' bulbs
      // It throws the scene's shadows, so it is aimed at the alley and its shadow camera framed on it: a box wide
      // enough for the stalls, the lanterns and the trees over them, and no wider, or the map's pixels spread thin.
      const alley = new THREE.Vector3(((STALLS[0].x + STALLS[4].x) / 2) * S, 0, PATH.z * S);
      // Low and down the street, from the moon's own quarter: shadows then fall back along the alley, across the
      // flagstones and towards him, where they can be seen, rather than straight down under the counters.
      lamp.position.copy(alley).add(new THREE.Vector3(14, 10, 4));
      lamp.target.position.copy(alley);
      lamp.castShadow = true;
      lamp.shadow.mapSize.setScalar(innerWidth < 900 ? SHADOW.small : SHADOW.map); // set once: resizing the map reallocates it
      lamp.shadow.camera.near = 1;
      lamp.shadow.camera.far = 46;
      lamp.shadow.camera.left = lamp.shadow.camera.bottom = -SHADOW.span;
      lamp.shadow.camera.right = lamp.shadow.camera.top = SHADOW.span;
      lamp.shadow.bias = SHADOW.bias;
      lamp.shadow.normalBias = SHADOW.normalBias;
      scene.add(lamp.target);
      const flash = new THREE.PointLight(0xffffff, 0, 0, 0); // each firework's burst, in its colour, all over the mela
      // The mela is lit by the sky photo itself (see skyEnvironment), as the home page's street is: the ambient light
      // and every reflection come out of the night sky. What is left of the hemisphere light is a little lift in the
      // shadows, under the sky's own.
      const disposeEnv = skyEnvironment(renderer, scene, skyLoad, Math.PI / 2, ENV_LIGHT, () => dead);
      scene.add(dome, new THREE.HemisphereLight(0x8a9ad0, 0x3a2a20, 0.45), lamp, flash);

      // The fairground keeps the PBR materials it was authored with: scene.environment only reaches
      // MeshStandardMaterial, and flattening them to Lambert would cut the mela off from the sky's light.
      const fair = mela.scene;
      fair.traverse((o) => (o.receiveShadow = true)); // casting is settled below, once the model is placed
      fair.scale.setScalar(S);
      scene.add(fair);
      fair.updateMatrixWorld(true);
      const skin = new Set<THREE.MeshStandardMaterial>();
      fair.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (!m?.isMeshStandardMaterial || skin.has(m)) return;
        skin.add(m);
        const g = GLOW[m.name];
        if (g === undefined) return;
        if (m.map) {
          m.emissiveMap = m.map; // the glow follows the stripes, the bulbs, the lettering
          m.emissive.setScalar(g);
        } else m.emissive.copy(m.color).multiplyScalar(g);
        m.emissiveIntensity = 1;
      });

      // Only what stands near the alley is drawn again into the shadow map. Everything else — the far stalls, the
      // trees round the rim, the circus — is outside the lamp's shadow camera anyway, and asking it to cast would
      // cost a second pass over the whole fairground for nothing.
      {
        const near = new THREE.Box3().setFromCenterAndSize(alley, new THREE.Vector3(SHADOW.span * 2, 200, SHADOW.span * 2));
        const box = new THREE.Box3();
        fair.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return;
          o.castShadow = near.intersectsBox(box.setFromObject(o));
        });
      }

      // The fairground came with gravel underfoot and one patch of lawn laid off its edge. That lawn's turf goes over
      // the whole ground instead, tiled GRASS.repeat times across each of the ground's four texture sheets, so the
      // mela stands on grass; the alley keeps its flagstones. The patch itself is then of no further use.
      const groundGroup = find(fair, "ground");
      const lawn = find(fair, "Object_4.001");
      const turf = ((lawn as THREE.Mesh | undefined)?.material as THREE.MeshStandardMaterial | undefined)?.map;
      if (turf && groundGroup) {
        const grass = turf.clone();
        grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
        grass.repeat.setScalar(GRASS.repeat);
        grass.needsUpdate = true;
        groundGroup.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
          if (!m?.isMeshStandardMaterial) return;
          m.map = grass;
          m.color.setScalar(1); // the gravel sheets were tinted; the turf carries its own colour
          m.needsUpdate = true;
        });
        if (lawn) lawn.visible = false;
      }
      // The earth beyond the fairground borrows the ground's texture, tiled wider still.
      let ground: THREE.MeshStandardMaterial | undefined;
      groundGroup?.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (!ground && m?.isMeshStandardMaterial && m.map) ground = m;
      });
      const earthMat = ground ? new THREE.MeshStandardMaterial({ map: ground.map!.clone(), color: ground.color }) : new THREE.MeshStandardMaterial({ color: 0x4a3a2a });
      if (earthMat.map) {
        earthMat.map.wrapS = earthMat.map.wrapT = THREE.RepeatWrapping;
        earthMat.map.repeat.setScalar(GRASS.earth);
        earthMat.map.needsUpdate = true;
      }
      // The ground rolls, and he walks on it: its height is sampled along the street once, here, and read back by
      // lerp, so nothing is measured per frame.
      const PROBE = { from: PATH.start - 0.4, to: STALLS[4].x + 0.8, steps: 64 };
      // He walks on the alley's flagstones where they are laid and on the bare fairground either side of them, so
      // both are measured; the highest of them under a point (below 12 m, as a ray down would first meet it) is the
      // floor there.
      const floor = [groundGroup, find(fair, "ishitatami.001_Material.044_0")].filter(Boolean) as THREE.Object3D[];
      // The floor's height under each of pts (x, z in the model's units), or -Infinity where there is none. One pass
      // over the floor's triangles serves every point: a ray per point tests the whole ground each time, which froze
      // the page for many seconds. Only triangles across the points' strip of z are tested against them.
      const heightsUnder = (pts: [number, number][]) => {
        const top = new Float32Array(pts.length).fill(-Infinity);
        const zs = pts.map(([, z]) => z * S);
        const [zLo, zHi] = [Math.min(...zs), Math.max(...zs)];
        const [a, b, c] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
        for (const root of floor.length ? floor : [fair])
          root.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            const pos = mesh.geometry.attributes.position;
            const idx = mesh.geometry.index;
            const n = idx ? idx.count : pos.count;
            for (let i = 0; i < n; i += 3) {
              a.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(mesh.matrixWorld);
              b.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(mesh.matrixWorld);
              c.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(mesh.matrixWorld);
              if (Math.max(a.z, b.z, c.z) < zLo || Math.min(a.z, b.z, c.z) > zHi) continue;
              const d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
              if (d === 0) continue; // edge-on from above
              for (let k = 0; k < pts.length; k++) {
                const x = pts[k][0] * S;
                const z = zs[k];
                const u = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / d;
                const v = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / d;
                if (u < 0 || v < 0 || u + v > 1) continue;
                const y = u * a.y + v * b.y + (1 - u - v) * c.y;
                if (y < 12 && y > top[k]) top[k] = y;
              }
            }
          });
        return top;
      };
      // The street's paving is laid stone by stone, and between the stones the floor under it is the ground, a hand
      // lower: so each sample takes the highest within two either side (filling the gaps), then the mean of those
      // round it, and neither he nor the camera bobs over the joints.
      const raw = heightsUnder(Array.from({ length: PROBE.steps + 1 }, (_, i): [number, number] => [PROBE.from + ((PROBE.to - PROBE.from) * i) / PROBE.steps, PATH.z]));
      const near = (a: Float32Array | number[], i: number) => Array.from(a.slice(Math.max(0, i - 2), i + 3));
      const filled = Array.from(raw, (_, i) => Math.max(...near(raw, i)));
      const heights = filled.map((_, i) => {
        const hits = near(filled, i).filter(Number.isFinite);
        return hits.length ? hits.reduce((n, y) => n + y, 0) / hits.length : -0.13 * S;
      });
      // The fairground is modelled as an island, and its ground rolls: the earth is laid under the lowest of it, so
      // the two never fight for the same pixels, and runs off into the fog.
      const earth = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), earthMat);
      earth.rotation.x = -Math.PI / 2;
      earth.receiveShadow = true;
      {
        // the lowest point of its upward faces: its sides run on down out of sight, under the earth
        let low = Infinity;
        const [v, up] = [new THREE.Vector3(), new THREE.Vector3()];
        groundGroup?.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          const { position: pos, normal } = mesh.geometry.attributes;
          const turn = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
          for (let i = 0; i < pos.count; i++) {
            if (normal && up.fromBufferAttribute(normal, i).applyMatrix3(turn).normalize().y < 0.5) continue;
            low = Math.min(low, v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).y);
          }
        });
        earth.position.y = (low === Infinity ? 0 : low) - 0.9;
      }
      scene.add(earth);

      const groundAt = (x: number) => {
        const t = THREE.MathUtils.clamp(((x / S - PROBE.from) / (PROBE.to - PROBE.from)) * PROBE.steps, 0, PROBE.steps);
        const i = Math.floor(t);
        return THREE.MathUtils.lerp(heights[i], heights[Math.min(i + 1, PROBE.steps)], t - i);
      };

      // The rides, each turning for ever on the clip it came with, and the two fairgoers with Mixamo idles of their
      // own. Each gets a mixer rooted at its own group: several of them share bone names, so one mixer over the whole
      // fairground would bind every clip to whichever skeleton came first.
      const mixers: THREE.AnimationMixer[] = [];
      for (const { group, clip, at } of [...RIDES.map((r) => ({ ...r, at: 0 })), ...ACTORS]) {
        const root = find(fair, group);
        const take = mela.animations.find((a) => a.name === clip);
        if (!root || !take) {
          console.warn("EventsStreet: no", group, clip);
          continue;
        }
        const m = new THREE.AnimationMixer(root);
        m.clipAction(take).play().time = at * take.duration;
        mixers.push(m);
      }

      // Everyone the model left standing still. The rigged one gets a real idle on its bones: the chest fills and
      // empties, the weight shifts from foot to foot, and the head and hands move as if mid-sentence. The rest are
      // single poses, so they breathe with a slow swell and the faintest sway about their feet.
      const SWAY: Record<string, { amp: [number, number, number]; rate: number; off: number }> = {
        Hips: { amp: [0.008, 0.02, 0.016], rate: 0.21, off: 0 }, // the weight shift
        Spine: { amp: [0.035, 0.012, 0.014], rate: 0.26, off: 0 }, // the breath
        Spine1: { amp: [0.03, 0.01, 0.012], rate: 0.26, off: 0.15 },
        Spine2: { amp: [0.022, 0.03, 0.01], rate: 0.26, off: 0.3 },
        Neck: { amp: [0.03, 0.05, 0.022], rate: 0.5, off: 0.2 },
        Head: { amp: [0.055, 0.075, 0.035], rate: 0.47, off: 0.55 }, // talking: small nods and turns
        LeftShoulder: { amp: [0.02, 0.016, 0.02], rate: 0.33, off: 0.4 },
        RightShoulder: { amp: [0.02, 0.016, 0.02], rate: 0.31, off: 0.9 },
        LeftArm: { amp: [0.04, 0.03, 0.05], rate: 0.29, off: 1.1 },
        RightArm: { amp: [0.04, 0.03, 0.05], rate: 0.27, off: 0.3 },
        LeftForeArm: { amp: [0.06, 0.02, 0.04], rate: 0.43, off: 1.6 },
        RightForeArm: { amp: [0.06, 0.02, 0.04], rate: 0.41, off: 0.7 },
      };
      type Idler = { phase: number; group: THREE.Object3D; base: number; y0: number; bones: { bone: THREE.Object3D; rest: THREE.Quaternion; amp: THREE.Vector3; rate: number; off: number }[] };
      const idlers: Idler[] = [];
      for (const { group, phase } of IDLERS) {
        const root = find(fair, group);
        if (!root) continue;
        const bones: Idler["bones"] = [];
        root.traverse((o) => {
          const spec = (o as THREE.Bone).isBone ? SWAY[boneKey(o.name)] : undefined;
          if (spec) bones.push({ bone: o, rest: o.quaternion.clone(), amp: new THREE.Vector3(...spec.amp), rate: spec.rate, off: spec.off });
        });
        idlers.push({ phase, group: root, base: root.scale.y, y0: root.position.y, bones });
      }
      const spin = new THREE.Euler();
      const spun = new THREE.Quaternion();
      const breathe = (t: number) => {
        for (const idler of idlers) {
          const u = (t + idler.phase) * Math.PI * 2;
          if (idler.bones.length) {
            for (const b of idler.bones) {
              spin.set(b.amp.x * Math.sin(u * b.rate + b.off), b.amp.y * Math.sin(u * b.rate * 0.7 + b.off * 1.7), b.amp.z * Math.sin(u * b.rate * 1.3 + b.off * 0.6));
              b.bone.quaternion.copy(b.rest).multiply(spun.setFromEuler(spin));
            }
          } else {
            idler.group.scale.y = idler.base * (1 + 0.009 * Math.sin(u * 0.26));
            idler.group.position.y = idler.y0 + 0.004 * Math.sin(u * 0.26 + 1);
            idler.group.rotation.z = 0.006 * Math.sin(u * 0.19);
          }
        }
      };

      // Strings of bulbs (see BULBS). Each is a run of points through the scene, carried by parent so it turns with it.
      const sparkTex = glowDot();
      const bulbColours = BULBS.colours.map((c) => new THREE.Color(c));
      const strings: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>[] = [];
      const bulbString = (points: THREE.Vector3[], parent: THREE.Object3D) => {
        const pos = new Float32Array(points.length * 3);
        points.forEach((p, i) => parent.worldToLocal(p.clone()).toArray(pos, i * 3));
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(points.length * 3), 3).setUsage(THREE.DynamicDrawUsage));
        const bulbs = new THREE.Points(
          geo,
          new THREE.PointsMaterial({ size: BULBS.size, map: sparkTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
        );
        bulbs.frustumCulled = false;
        parent.add(bulbs);
        strings.push(bulbs);
      };
      // A ring round the giant wheel's rim, riding the disc so the bulbs turn with it.
      const disc = find(fair, "wheel");
      if (disc) {
        const ring = new THREE.Box3().setFromObject(disc);
        const size = ring.getSize(new THREE.Vector3());
        const centre = ring.getCenter(new THREE.Vector3());
        const r = Math.max(size.x, size.z, size.y) / 2;
        const across = new THREE.Vector3(1, 0, 0).applyQuaternion(disc.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < BULBS.wheel; i++) {
          const a = (i / BULBS.wheel) * Math.PI * 2;
          pts.push(centre.clone().addScaledVector(across, r * Math.cos(a)).setY(centre.y + r * Math.sin(a)));
        }
        bulbString(pts, disc);
      }
      // A festoon the length of the alley, sagging bay to bay just under the lanterns.
      const festoon = (x0: number, x1: number, z: number, y: number, n: number, span: number) => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= n; i++) {
          const x = x0 + ((x1 - x0) * i) / n;
          pts.push(new THREE.Vector3(x * S, (y - Math.sin((((x - x0) / span) % 1) * Math.PI) * BULBS.sag) * S, z * S));
        }
        bulbString(pts, scene);
      };
      festoon(PATH.start - 0.2, STALLS[4].x + 0.55, PATH.z, 0.64, 60, 0.49);
      let phase = -1; // which third of the bulbs is lit
      const chaseBulbs = (time: number) => {
        const now = Math.floor(time * BULBS.chase) % 3;
        if (now === phase) return;
        phase = now;
        for (const bulbs of strings) {
          const col = bulbs.geometry.attributes.color as THREE.BufferAttribute;
          for (let i = 0; i < col.count; i++) {
            const c = bulbColours[i % bulbColours.length];
            const b = i % 3 === now ? 1 : 0.28;
            col.setXYZ(i, c.r * b, c.g * b, c.b * b);
          }
          col.needsUpdate = true;
        }
      };
      chaseBulbs(0);

      // Fireworks (see SHOWS), once the shell's file lands.
      const shows = fireworkShows(SHOWS, sparkTex, flash);
      scene.add(shows.sparks);
      shellLoad.then((buf) => !dead && shows.build(buf)).catch((e) => console.error("EventsStreet fireworks:", e));

      const camera = new THREE.PerspectiveCamera(CHASE.fov, 1, 0.1, 400);

      // The lettering. The lanterns and the yatai signs are both repainted on a canvas over the texture they came
      // with, once the site's Devanagari face has loaded.
      const deva = getComputedStyle(document.documentElement).getPropertyValue("--font-yatra").trim() || "serif";
      const fontReady = document.fonts.load(`${LANTERN.size}px ${deva}`, [...LANTERN.words, ...SIGN_TEXT].join("")).catch(() => {});
      // Draws text at most wide px across, shrinking the face until it fits.
      const fitted = (g: CanvasRenderingContext2D, text: string, size: number, wide: number) => {
        g.font = `${size}px ${deva}`;
        while (size > 6 && g.measureText(text).width > wide) g.font = `${(size *= 0.94)}px ${deva}`;
      };
      const repaint = (m: THREE.MeshStandardMaterial, paint: (g: CanvasRenderingContext2D, w: number) => void) => {
        const img = m.map?.image as (CanvasImageSource & { width: number; height: number }) | undefined;
        if (!img || m.userData.hindi) return;
        m.userData.hindi = true;
        fontReady.then(() => {
          if (dead) return;
          const canvas = document.createElement("canvas");
          const up = Math.max(1, 1024 / img.width); // the model's textures are small; the lettering is drawn sharp
          canvas.width = img.width * up;
          canvas.height = img.height * up;
          const g = canvas.getContext("2d")!;
          g.drawImage(img, 0, 0, canvas.width, canvas.height);
          paint(g, canvas.width);
          const tex = new THREE.CanvasTexture(canvas);
          tex.flipY = false; // as glTF textures are
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          tex.wrapS = m.map!.wrapS;
          tex.wrapT = m.map!.wrapT;
          m.map!.dispose();
          m.map = tex;
          if (m.emissiveMap) m.emissiveMap = tex;
          m.needsUpdate = true;
        });
      };
      for (const m of skin) {
        if (flat(m.name) === flat("Material.002")) {
          repaint(m, (g, w) => {
            const k = w / 1024; // the layout in LANTERN is for the 1024 px texture
            g.drawImage(g.canvas, 100 * k, 0, 160 * k, 330 * k, 440 * k, 0, 160 * k, 330 * k); // the old letters, covered
            g.fillStyle = LANTERN.colour;
            g.textAlign = "center";
            g.textBaseline = "middle";
            LANTERN.words.forEach((word, i) => {
              g.save();
              g.translate(((i * 2 + 1) / (LANTERN.words.length * 2)) * w, LANTERN.y * k); // spread round it
              g.scale(1, -1); // upside down, as the texture is
              fitted(g, word, LANTERN.size * k, 300 * k);
              g.fillText(word, 0, 0);
              g.restore();
            });
          });
          continue;
        }
        const blocks = Object.entries(SIGNS).find(([n]) => flat(n) === flat(m.name))?.[1];
        if (!blocks) continue;
        repaint(m, (g, w) => {
          const k = w / 1024;
          blocks.forEach((b, i) => {
            const px = g.getImageData(Math.round(b.from[0] * k), Math.round(b.from[1] * k), 1, 1).data;
            g.save();
            g.translate(b.at[0] * k, b.at[1] * k);
            g.rotate((b.turn * Math.PI) / 180);
            g.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`;
            g.fillRect((-b.w / 2) * k, (-b.h / 2) * k, b.w * k, b.h * k); // the old lettering, painted out
            g.fillStyle = b.ink;
            g.textAlign = "center";
            g.textBaseline = "middle";
            fitted(g, SIGN_TEXT[i % SIGN_TEXT.length], b.h * 0.62 * k, b.w * 0.92 * k);
            g.scale(1, -1); // upside down, as the texture is
            g.fillText(SIGN_TEXT[i % SIGN_TEXT.length], 0, 0);
            g.restore();
          });
        });
      }

      // The walls: a page, and its hole in the canvas, the same size in the same place, on the stall's back wall,
      // facing the street as the stall does.
      const hole = new THREE.MeshBasicMaterial({ color: 0, opacity: 0, blending: THREE.NoBlending, fog: false });
      const stalls = STALLS.map(({ x, side }, i) => {
        // The north row's curtains face down the alley (+z) and the south row's back up it (-z); off lifts the page
        // off the cloth towards the alley either way.
        const z = side < 0 ? WALL.north + WALL.off : WALL.south - WALL.off;
        const centre = new THREE.Vector3(x, (WALL.top + WALL.bottom) / 2, z).multiplyScalar(S);
        const h = (WALL.top - WALL.bottom) * S;
        const page = new CSS3DObject(pages[i]);
        const mask = new THREE.Mesh(new THREE.PlaneGeometry(h * aspect, h), hole);
        for (const o of [page, mask]) {
          o.position.copy(centre);
          o.rotation.y = side > 0 ? Math.PI : 0; // both face +z as made
        }
        scene.add(page, mask);
        const standZ = PATH.z + side * PATH.stand;
        const stand = new THREE.Vector3((x + PATH.aside) * S, groundAt((x + PATH.aside) * S), standZ * S);
        return {
          centre,
          normal: new THREE.Vector3(0, 0, -side), // out of the curtain, into the alley
          page,
          h,
          hold: { dist: 1, fov: CHASE.fov }, // set by resize
          stand,
          face: side < 0 ? Math.PI : 0, // heading: he faces (sin, 0, cos), so at the row he has turned to
        };
      });

      // Spider-Man, walking and standing on the soldier's clips (see rig.ts). He faces +z at heading 0.
      const rig = man.scene;
      scene.add(rig);
      rig.traverse((o) => {
        o.frustumCulled = false; // skinned bounds stay at the rest pose
        o.castShadow = true;
      });
      const { retarget, mixer: sMixer } = soldier(walker, STRIDE);
      const mixer = new THREE.AnimationMixer(rig);
      const walkClip = retarget(rig);
      const idleClip = retarget(rig, "Idle");
      const walk = mixer.clipAction(walkClip).play();
      const idle = mixer.clipAction(idleClip).play();
      const pose = (walkT: number, walking: number, idleT: number) => {
        walk.time = walkT % walkClip.duration;
        idle.time = idleT % idleClip.duration;
        walk.setEffectiveWeight(walking);
        idle.setEffectiveWeight(1 - walking);
        mixer.update(0);
      };
      const speed = strideSpeed(rig, (t) => pose(t, 1, 0), walkClip.duration); // feet stay planted at this pace

      // A leg of a walk, as phases posing him and the camera at t (0 … 1) through each: from frame s (where he stands,
      // or walks, maybe facing a stall's page) turn towards to (the camera pulling back from the page and swinging
      // round to chase, the way he now goes along the street), walk straight there, and, if to is stall k's spot, turn
      // to face it (the camera pushing in to its page). len: screens of scroll; secs: the same played in time, for the
      // buttons.
      type Phase = { len: number; secs: number; at: (t: number) => Frame };
      const DOWN = Math.PI / 2; // down the street, +x; back up it is -DOWN
      const leg = (s: Frame, to: THREE.Vector3, k: number, chase: number): Phase[] => {
        const a = s.pos.clone();
        const dist = a.distanceTo(to);
        const way = dist > 0.01 ? Math.atan2(to.x - a.x, to.z - a.z) : s.heading;
        const w1 = s.walked + dist;
        const out: Phase[] = [
          {
            len: s.stall < 0 && s.chase === chase ? PACE.start : PACE.turn,
            secs: TRIP.turn,
            at: (t) => ({
              pos: a,
              heading: turnTo(s.heading, way, smooth(t, 0.4, 1)),
              // a U-turn swings the camera round him on the street's side
              chase: turnTo(s.chase, chase, smooth(t, 0.2, 1)),
              walked: s.walked,
              walking: s.walking * (1 - smooth(t, 0, 0.3)),
              stall: s.stall,
              push: s.push * (1 - smooth(t, 0, 0.6)),
            }),
          },
          {
            len: dist / PACE.metres,
            secs: dist / (speed * TRIP.pace),
            // easing into and out of the walk over its first and last half metre
            at: (t) => ({ pos: a.clone().lerp(to, t), heading: way, chase, walked: s.walked + dist * t, walking: Math.min(1, (dist * t) / 0.5, (dist * (1 - t)) / 0.5), stall: -1, push: 0 }),
          },
        ];
        if (k >= 0) {
          const face = stalls[k].face;
          out.push({ len: PACE.turn, secs: TRIP.turn, at: (t) => ({ pos: to, heading: turnTo(way, face, smooth(t, 0, 0.6)), chase, walked: w1, walking: 0, stall: k, push: smooth(t, 0.4, 1) }) });
        }
        return out.filter((ph) => ph.len > 0); // a leg from where he already stands has no walk
      };
      // The scroll route, a loop: from the street's near end to each stall in turn (holding on its page), a U-turn at
      // the last, back past the others (holding on each again) to where he started, and a U-turn there to face down
      // the street, as at the start. Scrolling past its end carries on from its start (see the ScrollTrigger below).
      const start = new THREE.Vector3(PATH.start * S, groundAt(PATH.start * S), PATH.z * S);
      const phases: Phase[] = [];
      const holds: { k: number; chase: number; u: number }[] = []; // each hold on a page, mid-way, in screens of scroll
      let at: Frame = { pos: start, heading: DOWN, chase: DOWN, walked: 0, walking: 0, stall: -1, push: 0 };
      const stops = [...stalls.keys(), ...[...stalls.keys()].reverse().slice(1), -1];
      for (const [i, k] of stops.entries()) {
        const chase = i < stalls.length ? DOWN : -DOWN;
        phases.push(...leg(at, k < 0 ? start : stalls[k].stand, k, chase));
        at = phases[phases.length - 1].at(1);
        if (k < 0) break;
        const still = at;
        holds.push({ k, chase, u: phases.reduce((n, ph) => n + ph.len, 0) + PACE.hold / 2 });
        phases.push({ len: PACE.hold, secs: 0, at: () => still });
      }
      const back = at;
      phases.push({ len: PACE.turn, secs: 0, at: (t) => ({ ...back, heading: turnTo(back.heading, DOWN, smooth(t)), chase: turnTo(back.chase, DOWN, smooth(t)) }) });
      const screens = phases.reduce((n, ph) => n + ph.len, 0);
      const playAt = (list: Phase[], u: number, unit: "len" | "secs") => {
        for (const ph of list) {
          if (u <= ph[unit]) return ph.at(ph[unit] > 0 ? u / ph[unit] : 1);
          u -= ph[unit];
        }
        return list[list.length - 1].at(1);
      };

      let zoom = 1; // narrow screens chase from further back, as on the home page: else he fills the screen
      let progress = 0;
      let idleT = 0; // the idle's clock, run by the frame loop
      let shown: Frame = phases[0].at(0); // the frame on screen
      let looped = false;
      let trip: { phases: Phase[]; t0: number; k: number; chase: number } | null = null; // a stall button's walk, playing
      let active = -1;
      const fwd = new THREE.Vector3();
      const aim = new THREE.Vector3();
      const line = PATH.z * S; // the street's line: the chase camera keeps halfway between him and it
      // Places him and the camera for frame f; the frame loop poses and draws.
      const draw = (f: Frame) => {
        shown = f;
        const y = groundAt(f.pos.x);
        rig.position.set(f.pos.x, y, f.pos.z);
        rig.rotation.y = f.heading;
        fwd.set(Math.sin(f.chase), 0, Math.cos(f.chase));
        camera.position.copy(f.pos).addScaledVector(fwd, -CHASE.back * zoom).setY(y + CHASE.up);
        camera.position.z = (camera.position.z + line) / 2;
        aim.copy(f.pos).addScaledVector(fwd, CHASE.ahead).setY(y + CHASE.aim);
        let fov = CHASE.fov;
        const p = f.stall < 0 ? 0 : f.push;
        if (p > 0) {
          const s = stalls[f.stall];
          camera.position.lerp(s.centre.clone().addScaledVector(s.normal, s.hold.dist), p);
          aim.lerp(s.centre, p);
          fov = THREE.MathUtils.lerp(CHASE.fov, s.hold.fov, p);
        }
        if (camera.fov !== fov) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
        camera.lookAt(aim);
        // Only the page being looked at takes clicks and focus; its button is marked as the current one.
        const now = p > 0.6 ? f.stall : -1;
        if (now !== active) {
          pages.forEach((d, i) => (d.inert = i !== now));
          jumps.current.forEach((b, i) => b?.setAttribute("aria-current", String(i === now)));
          active = now;
        }
        const moved = progress > 0.005 || trip !== null || looped; // the title goes once he sets off
        if (sec.hasAttribute("data-moved") !== moved) sec.toggleAttribute("data-moved", moved);
      };
      // The frame loop, while the scene is on screen: his idle, the rides, the fairgoers, the bulbs, the fireworks;
      // then the scene, with the sky on the camera.
      let clock = 0;
      let then = 0;
      const frame = (now: number) => {
        const dt = Math.min((now - then) / 1000, 0.1);
        then = now;
        clock += dt;
        idleT += dt;
        pose(shown.walked / speed, shown.walking, idleT);
        for (const m of mixers) m.update(dt);
        breathe(clock);
        chaseBulbs(clock);
        shows.update(dt);
        dome.position.copy(camera.position);
        renderer.render(scene, camera);
        css.render(scene, camera);
      };
      // Every material's shaders, compiled before the first frame and off the main thread where the browser can
      // (KHR_parallel_shader_compile): else the first frame compiles them all at once and the page freezes.
      await renderer.compileAsync(scene, camera);
      if (dead) {
        renderer.dispose();
        return;
      }
      const io = new IntersectionObserver(([e]) => {
        then = performance.now();
        renderer.setAnimationLoop(e.isIntersecting ? frame : null);
      });
      io.observe(el);

      const resize = () => {
        const [w, h] = [el.clientWidth, el.clientHeight];
        renderer.setSize(w, h);
        css.setSize(w, h);
        camera.aspect = w / h;
        zoom = Math.max(1, 0.8 / camera.aspect);
        // The fixed nav bar (the layout's first header) covers the top and the stall buttons the bottom: centre every
        // shot in the space between.
        const nav = document.querySelector("header")?.offsetHeight ?? 0;
        const foot = h - (bar.current?.offsetTop ?? h);
        camera.setViewOffset(w, h, 0, (foot - nav) / 2, w, h);
        // Each page is laid out at the size it will have on screen, so its text is drawn 1:1, sharp.
        const pw = Math.round(Math.min(HOLD.fill.w * w, HOLD.fill.h * (h - nav - foot) * aspect));
        const ph = Math.round(pw / aspect);
        const tan = Math.tan(THREE.MathUtils.degToRad(CHASE.fov / 2));
        for (const s of stalls) {
          s.page.element.style.width = `${pw}px`;
          s.page.element.style.height = `${ph}px`;
          s.page.scale.setScalar(s.h / ph);
          // Far enough back for the page to fill ph of the screen's h, at the chase lens; or nearer, with a wider one.
          const dist = (s.h * h) / (2 * ph * tan);
          s.hold = dist <= HOLD.max ? { dist, fov: CHASE.fov } : { dist: HOLD.max, fov: 2 * THREE.MathUtils.radToDeg(Math.atan((s.h * h) / (2 * ph * HOLD.max))) };
        }
        setCompact(pw < COMPACT);
        camera.updateProjectionMatrix();
        draw(shown);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();
      sec.toggleAttribute("data-ready", true);

      // Moves the scroll at once (progress is set to where it lands first).
      const jump = (y: number) => {
        y = Math.max(st.start, y);
        progress = (y - st.start) / (st.end - st.start);
        jumpScroll(y);
      };
      // Pin and scrub: one screen of scrolling per screen in the phases. While a trip plays, scrolling is held off.
      const st = ScrollTrigger.create({
        trigger: sec,
        start: "top top",
        end: `+=${screens * 100}%`,
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          progress = self.progress;
          if (trip) return;
          draw(playAt(phases, progress * screens, "len"));
          // The loop ends as it starts: at its end, jump back a loop's length (keeping any overshoot) and walk on.
          if (self.scroll() >= self.end - 1) {
            looped = true;
            jump(self.scroll() - (self.end - self.start));
          }
        },
      });

      // The stall buttons: from wherever he is, straight to stall k and its page, played in time with no scrolling.
      // At the end the scroll jumps to that page's hold, where the scroll route shows the same frame, so scrolling
      // carries on from there.
      let raf = 0;
      const step = (now: number) => {
        if (!trip) return;
        const t = (now - trip.t0) / 1000;
        const total = trip.phases.reduce((n, ph) => n + ph.secs, 0);
        draw(playAt(trip.phases, Math.min(t, total), "secs"));
        if (t < total) {
          raf = requestAnimationFrame(step);
          return;
        }
        const { k, chase } = trip;
        const hold = holds.find((h) => h.k === k && h.chase === chase) ?? holds.find((h) => h.k === k)!;
        trip = null;
        getLenis()?.start();
        jump(st.start + (hold.u / screens) * (st.end - st.start));
      };
      goTo.current = (k) => {
        if (shown.stall === k && shown.push === 1) return; // already there
        cancelAnimationFrame(raf);
        getLenis()?.stop();
        const dx = stalls[k].stand.x - shown.pos.x;
        const chase = Math.abs(dx) < 0.01 ? shown.chase : dx > 0 ? DOWN : -DOWN; // facing the way he goes
        trip = { phases: leg(shown, stalls[k].stand, k, chase), t0: performance.now(), k, chase };
        raf = requestAnimationFrame(step);
      };

      cleanup = () => {
        renderer.setAnimationLoop(null);
        io.disconnect();
        cancelAnimationFrame(raf);
        if (trip) getLenis()?.start();
        goTo.current = null;
        st.kill(true);
        ro.disconnect();
        mixer.stopAllAction();
        sMixer.stopAllAction();
        for (const m of mixers) m.stopAllAction();
        for (const bulbs of strings) {
          bulbs.geometry.dispose();
          bulbs.material.dispose();
        }
        shows.dispose();
        sparkTex.dispose();
        disposeSky();
        disposeEnv();
        scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            [o.material].flat().forEach((m) => {
              for (const v of Object.values(m)) if ((v as THREE.Texture | null)?.isTexture) (v as THREE.Texture).dispose();
              m.dispose();
            });
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
        css.domElement.remove();
      };
    })().catch((e) => {
      console.error("EventsStreet:", e);
      if (!dead) setFallback(true);
    });

    return () => {
      dead = true;
      cleanup();
    };
  }, []);

  if (fallback) return <EventsPanels />;

  const show = (cat: EventCategory) => {
    setOpen(cat);
    getLenis()?.stop();
    dialog.current?.showModal();
  };
  const tone = (cat: EventCategory) => tones[eventCategories.indexOf(cat) + 1]; // the panels' colours (0 is their title)

  return (
    // GSAP wraps the pinned section in a spacer; this outer div is what React removes on unmount.
    <div>
      <section ref={pin} aria-label="The mela: one stall per event category" className="group relative h-[100dvh] overflow-hidden" style={{ background: "#141a2e" }}>
        <div ref={layer} className="absolute inset-0" />
        <div ref={host} className="absolute inset-0" style={{ pointerEvents: "none" }} />
        <div className="pointer-events-none absolute left-4 top-24 transition-opacity duration-500 group-data-[moved]:opacity-0 md:left-8">
          <p className="painted font-deva text-[clamp(1.8rem,5vw,3rem)] leading-none text-cream" aria-hidden="true">
            कार्यक्रम
          </p>
          <h1 className="painted font-display text-[clamp(2.8rem,9vw,6rem)] leading-[.85] text-cream misprint">EVENTS</h1>
          <p className="mt-4 w-fit bg-ink px-3 py-1 font-mono text-sm font-bold tracking-widest text-turmeric">
            <span className="group-data-[ready]:hidden">SETTING UP THE STALLS…</span>
            <span className="hidden group-data-[ready]:inline">SCROLL TO WALK THE MELA</span>
          </p>
        </div>
        {/* A button per stall: he walks straight there and the camera turns to its page, no scrolling. Laid out (not
            shown) before the scene is ready, so the scene can measure the space it takes. */}
        <nav ref={bar} aria-label="Go to a stall" className="invisible absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 px-4 py-3 group-data-[ready]:visible">
          {eventCategories.map((c, i) => (
            <button
              key={c.id}
              ref={(b) => {
                jumps.current[i] = b;
              }}
              type="button"
              onClick={() => goTo.current?.(i)}
              aria-current="false"
              className={`btn whitespace-nowrap !px-3 !py-2 !text-xs md:!text-sm ${tone(c)} aria-[current=true]:outline aria-[current=true]:outline-4 aria-[current=true]:outline-offset-2 aria-[current=true]:outline-turmeric`}
            >
              {c.title}
            </button>
          ))}
        </nav>
      </section>
      {walls.map((w, i) => createPortal(<StallPage cat={eventCategories[i]} tone={tone(eventCategories[i])} compact={compact} onOpen={show} />, w, String(i)))}
      {/* Narrow screens: a stall's page in full, over the scene. */}
      <dialog
        ref={dialog}
        data-lenis-prevent
        onClose={() => {
          setOpen(null);
          getLenis()?.start();
        }}
        aria-label={open?.heading}
        className={`m-auto max-h-[88dvh] w-[min(94vw,40rem)] overflow-y-auto border-4 border-ink p-5 pt-14 backdrop:bg-ink/70 ${open ? tone(open) : ""}`}
      >
        <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="btn absolute right-3 top-3 size-11 justify-center bg-cream !p-0 text-ink">
          <X weight="bold" aria-hidden="true" />
        </button>
        {open && <CategoryContent cat={open} />}
      </dialog>
    </div>
  );
}

// A category's page, as it hangs on its stall's back wall: the panel's heading and blurb beside its carousel of
// tickets; on a small screen a summary that opens the full page.
function StallPage({ cat, tone, compact, onOpen }: { cat: EventCategory; tone: string; compact: boolean; onOpen: (c: EventCategory) => void }) {
  return (
    <div className={`relative flex h-full w-full overflow-hidden border-4 border-ink ${tone}`}>
      <div className="halftone pointer-events-none absolute inset-0 text-ink/10" aria-hidden="true" />
      {compact ? (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-2 p-3 text-center">
          <p className="font-deva text-lg leading-none">{cat.hindi}</p>
          <h2 className="painted font-display text-xl leading-none text-cream">{cat.heading}</h2>
          <button type="button" onClick={() => onOpen(cat)} className="btn bg-cream !px-3 !py-1.5 !text-sm text-ink">
            See {cat.subEvents.length} events
          </button>
        </div>
      ) : (
        <div className="relative grid flex-1 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-6 p-6 lg:gap-10 lg:p-8">
          <div>
            <p className="font-deva text-2xl leading-none lg:text-3xl">{cat.hindi}</p>
            <h2 className="painted mt-2 font-display text-[clamp(1.8rem,3.6vw,3.25rem)] leading-none text-cream">{cat.heading}</h2>
            <p className="mt-3 text-base lg:text-lg">{cat.description}</p>
          </div>
          {/* clipped: the side tickets would otherwise swing out over the blurb */}
          <div className="-m-2 overflow-hidden p-2">
            <Carousel items={cat.subEvents} category={cat.title} />
          </div>
        </div>
      )}
    </div>
  );
}
