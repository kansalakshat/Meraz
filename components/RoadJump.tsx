"use client";

// Road scene: the section pins; scrolling walks the runner toward the camera while it swings from his face
// round to his back, then scrubs him flip-jumping over a Delhi Police barricade, then walking on down the road.
// The "Flip jump" clip carries root motion (it travels a few metres forward), so the barricade sits where his
// hand lands mid-vault. Pedestrians walk the footpaths in real time while the section is on screen.
// Loading: three.js ships with the page (the scene is the page), the opening shot's few assets are preloaded from the
// HTML (app/page.tsx) and drawn as soon as they land, and the rest of the street streams in behind them.
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, FastForward } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import type { Object3D } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneRig } from "three/addons/utils/SkeletonUtils.js";
import { melaModel, navLinks } from "@/data/site";
import { TLink, useGo } from "./Transition";
import { getLenis } from "./ScrollFx";
import { warmUp } from "./warmup";
import { HAZE, fireworkShows, glowDot, nightSky, skyEnvironment, type Show } from "./night";
import { bone, key, soldier, strideSpeed } from "./rig";

gsap.registerPlugin(ScrollTrigger);

// Street: the hand-built environment (enviroment.glb), split at build time into its road tile (env-road.glb) and
// everything else (env.glb). It is modelled about 1.7x life size (its chai-wala stands 2.9 m), so both are scaled by
// scale, turned round so its street runs on ahead of him (+z) to the water tank and billboard, raised by y (its road
// surface sits 0.17 below its origin) and moved along by z. Its houses end short of where he starts, so the row of
// houses (both sides) is repeated twice behind its first house, row (model units) apart; the tank and billboard are
// pushed vista metres further on, far enough to fit whole in the chase camera's view. The road tile repeats along z.
// Measured at that scale: the carriageway's edge is edge metres out, the footpaths kerbTop above the road.
const ENV = { scale: 0.6, y: 0.1, z: 35, edge: 5.5, kerbTop: 0.41, row: 95, vista: 30 };
// (Names as three.js loads them: "wall.001" becomes "wall001".)
const HOUSE_ROW = /^(pair_of_house|pan_shop|wall|tall_house|house_with_tank|good_house)(\d+)?$/;
const VISTA = /^(water_tank|Sketchfab_model|250px-.*|MV5B.*)$/; // the tank, the billboard and its two posters
// Lights on inside the houses: each building's street-facing windows (read off straight-on renders of its front), in
// the environment's own units as [x, y, z, w, h]: x the wall's face there (it faces +x, the road), y up, z along the
// street, w across, h tall. Their twins across the road (".001") are the same buildings turned round, so take the same.
const WINDOWS: Record<string, number[][]> = {
  pair_of_house: [
    [-19.43, 8.92, 5.5, 2.33, 2.17], [-19.19, 8.96, -3.42, 2.17, 2.25], [-18.81, 9.08, -7.67, 2, 2.5],
    [-19.19, 3.88, 4.62, 2.08, 1.58], [-18.87, 3.71, -3.79, 2.75, 1.75], [-19.26, 3.92, -8, 1.67, 2],
  ],
  tall_house: [[-18.38, 7.67, -47.71, 2.92, 1.83]], // behind its bars
  house_with_tank: [[-18.09, 7.75, -55.08, 2.17, 1.67], [-18.1, 7.75, -58.86, 2.72, 1.67], [-17.9, 2.83, -58.46, 2.42, 1.67]],
  good_house: [[-18.36, 9.17, -66.75, 1.33, 2.17], [-18.32, 9.17, -74.02, 1.29, 2.17]],
};
const WINDOW_TINTS = [0xffd27a, 0xffb85c, 0xfff0c8]; // warm lamplight, a little different in each
// Footpaths, keyed by side (+x is left as seen from the chase camera). Pedestrians walk one line along each, lane
// metres out, clear of the railings and house fronts. Trees stand on tree, street lights on lamp (at the kerb, arm
// over the road), except over the z spans where the environment's houses, walls, stalls and railings (or the title
// sign, for lamps) are in the way. Scanned from the model.
const PATHS: Record<number, { lane: number; tree: number; trees: number[][]; lamp: number; lamps: number[][] }> = {
  1: {
    lane: 6.3,
    tree: 7.6,
    trees: [[-74.1, -67.6], [-45.8, -42.8], [-36.9, -27.7], [-17.1, -10.6], [11.2, 14.9], [20.1, 29.7], [36.8, 46.6],
      [68.2, 71.2], [77.1, 86.3]],
    lamp: 5.65,
    lamps: [[-12, -8]],
  },
  [-1]: {
    lane: -6.3,
    tree: -7.6,
    trees: [[-84.3, -74.9], [-69.3, -65.8], [-44.2, -37.7], [-27.3, -17.9], [-12.3, -8.8], [12.8, 19.3], [29.7, 39.1],
      [44.7, 48.2], [69.8, 76.3], [107.3, 110.7]],
    lamp: -5.65,
    lamps: [[-12, -8], [33.3, 37.4], [42.6, 45.1], [107.4, 109.6]],
  },
};
const LAMP_GAP = 14; // metres between street lights along each side (staggered across the road)
// Where the left hand rests mid-vault (t ≈ 0.5–0.7 s), measured from the clip: the barricade top goes here.
const HAND_PLANT = { y: 0.9, z: 1.95 };
// The full moon in the night sky (see night.ts): el degrees up, straight down the street (the sky's +z), size degrees
// across (a long lens's moon, bigger than the eye's 0.5), dimmed to tint, in an aura aura times as wide.
const MOON = { el: 8.1, size: 1.6, tint: 0xcfd0c6, aura: 6 };
// Fireworks (see night.ts), out past the houses: two behind his start, three down the road ahead, launched below the
// road so the rockets rise out from behind the rooftops.
const SHOWS: Show[] = [
  { at: [-45, -5, -150], scale: 0.9, speed: 2.4, gap: 1.5 },
  { at: [55, -5, -190], scale: 1.1, speed: 2.1, gap: 2.5 },
  { at: [-35, -5, 210], scale: 1, speed: 2.3, gap: 1 },
  { at: [45, -5, 180], scale: 0.8, speed: 2.6, gap: 2 },
  { at: [5, -5, 250], scale: 1.2, speed: 2, gap: 3 },
];
// Keyboard: holding W scrolls on down the scene, S back up, at this many pixels a second.
const KEY_SCROLL = 450;
// The skip button scrolls the scene by itself, this many seconds a screen, to just past GO: seated, asked where to,
// with the destinations up.
const SKIP_PACE = 2;
// The "MERAZ 7.0" sign: metres wide, centre height, behind his start. The opening shot tilts up by tilt (rise per
// metre, about 9 deg) so his head sits low in the frame and the sign, raised high, shows clear above it.
const TITLE = { width: 10, y: 4.7, z: -10, tilt: 0.16 }; // y: lowest that still clears his hair in the opening shot
// Scroll beats: [0, ORBIT] walk while the camera swings round, [ORBIT, LAND] the jump, [LAND, STOP] two steps on,
// [STOP, SIT] without stopping he curves round to the auto (which set off when he jumped and has pulled up just
// ahead), ducks in and slides onto the bench, turning to face forward as he settles, [SIT, 1] he sits still.
const ORBIT = 0.24;
const LAND = 0.52;
const STOP = 0.62;
const SIT = 0.93;
// Seated, the driver asks where to (a speech bubble from his head at ASK), then the site's pages come up as
// destinations at GO. The home page has no nav bar; these are its navigation.
const ASK = 0.95;
const GO = 0.97;
// Picking a destination: the auto pulls away (accel m/s^2, carrying him and his eye camera, the lens widening by up to
// fov degrees with speed) and after fade seconds the screen starts fading to white into the new page.
const RIDE = { accel: 6, fov: 10, fade: 0.9 };
const WALK_CYCLES = 3; // walk cycles (two steps each) during the swing
const WALK_ON_CYCLES = 1; // and after landing
const STRIDE = 0.7; // leg swing kept from the soldier walk: a long stride stretches the dhoti (and the saree)
const BLEND = 0.03; // share of the scroll spent blending walk into jump, jump into walk, and walk into standing
// Auto rickshaw: waits up the road behind him from the first frame (start metres back, out metres further toward the
// kerb on his left as seen from the chase camera, i.e. +x, so the opening shot shows it beside him), pulls away as he
// walks, merges into its line before the barricade, overtakes him on his left as he jumps, and slows to a stop beside
// him as he stops. It slides; the model's wheels are part of one mesh and cannot turn.
// Its line passes the barricade's end close by, so that clear metres separate the two (half: half the auto's width at
// that height, measured from auto.glb). Metres: height, where it stops ahead of his last step (so he can curve round
// into it).
const AUTO = { height: 1.75, half: 0.75, clear: 0.1, start: -14, out: 1.9, ahead: 1.2 };
// The auto's rear bench, measured from auto.glb (metres, relative to the auto's centre): it sits behind the centre
// (z), its cushion about 0.5 m up, so seated hips are at hips. The side is open only ahead of the rear body panels,
// so he crosses in at entry, then slides back onto the bench. outside: how far out from the bench he stops.
const SEAT = { z: -0.75, hips: 0.62, entry: -0.35, outside: 1.0 };
// The light inside the auto: tint and power of the bulb under its roof, how far it carries (reach metres, falling off
// by decay), where it hangs (y up, z back from the auto's centre, roof just under the ceiling) and the size of the
// little pane it shines through.
const CABIN = { tint: 0xffe9c4, power: 10, reach: 5, decay: 2, y: 1.3, z: -0.5, roof: 1.46, size: 0.34, halo: 0.75 };
// The driver (the old man, shrunk by scale and posed seated), measured from auto.glb the same way: hips on the
// front of the driver's seat (cushion top about 0.75 m) so his arms reach the handlebar grips (x either side) with the
// elbows bent; back straight, leaning forward by lean radians; shins sloping forward by shin (run per metre down), so
// his shoes rest on the floor.
const DRIVER = { scale: 0.93, z: 0.28, hips: 0.8, lean: 0.1, shin: 0.3, grip: { x: 0.33, y: 1.03, z: 0.66 } };
// Sitting: thighs swing forward and knees bend back by these angles (radians), on top of the standing pose; duck is
// the forward lean of his back as he passes under the roof edge.
const SIT_BEND = { thigh: 1.45, knee: 1.5, duck: 0.6 };
// Camera: as the jump starts it pushes in to (push times) its chase distance, aiming up at aim metres to keep the flip in
// frame. As he turns to the auto it moves behind his head (behind metres back, over metres up); as he steps in it cuts
// to his eyes. eye: how far ahead of the head bone the eye camera sits (clear of
// his face), lift: how far above it once seated (high enough to see over the driver's seat to the handlebar).
const CAMERA = { push: 0.55, aim: 1.1, eye: 0.25, lift: 0.3, eyeFov: 75, behind: 0.9, over: 0.2 }; // eyeFov: wide lens of his eye view
// The shadow map: the street runs 190 m, far more than one map can hold, so its camera is only span metres each way
// and rides down the road with him (see draw). from: where the moonlight stands, relative to whatever it is lighting.
// How hard the sky photo lights the street as an environment map (see skyEnvironment in night.ts).
const ENV_LIGHT = 1.15;
const SHADOW = { span: 22, from: new THREE.Vector3(-14, 15, -9), bias: -0.0005, normalBias: 0.04, map: 2048, small: 1024 };
const STREET = { from: -80, to: 110 }; // z range lined with trees and lamps, from the fog behind him to the tank
const TREES = [
  { name: "tree-1", size: 5.5 },
  { name: "tree-2", size: 5.3 },
  { name: "tree-3", size: 7 },
];
// Pedestrians (height in metres). Within a lane everyone walks at the lane's one speed in one direction (their steps
// sped up or slowed to match), so gaps never close and nobody collides; the two footpaths walk opposite ways.
// The old man only drives the auto.
const PEOPLE = { man: 1.75, oldman: 1.65, woman: 1.6 };
const LANES = [
  { side: 1, dir: -1, mix: ["man", "woman"], gap: [9, 16] },
  { side: -1, dir: 1, mix: ["man", "woman"], gap: [9, 16] },
] as const;
const WALKWAY = { from: -60, len: 130 }; // pedestrians loop over this z range; the ends are lost in the haze
// Stall on the right-hand footpath (right as seen from the chase camera, i.e. -x) level with the barricade, its back at
// back (in front of the environment's wall), clear of the walking line. The keeper is a bust, behind the counter.
// lamp: the stall's bulb, hung out over the counter (out metres in front of it, up metres above the kerb) so it lights
// the keeper, the counter and its banner from the road side; tint, power, reach and decay as for CABIN.
const STALL = {
  height: 2.6, keeper: 0.95, keeperBase: 0.75, back: -9.9,
  lamp: { tint: 0xffd49a, power: 30, reach: 8, decay: 2, out: 0.5, up: 2.1, halo: 0.9 },
};

export default function RoadJump() {
  const pin = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const ride = useRef<((href: string) => void) | null>(null); // starts the ride to a page, once the scene can play it
  const skip = useRef<(() => void) | null>(null); // plays the scene up to the driver's question, once it can
  const goTo = useGo(); // stable while home is mounted
  const router = useRouter();

  useEffect(() => {
    const el = host.current!;
    // Held here, not read from the refs in the frame loop: navigating away detaches the refs a frame before cleanup.
    const sec = pin.current!;
    const tip = bubble.current!;
    let cleanup = () => {};
    let unwarm = () => {};
    let dead = false;

    (async () => {
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const load = (n: string) => loader.loadAsync(`/models/${n}.glb`);
      const font = getComputedStyle(document.documentElement).getPropertyValue("--font-bungee").trim() || "Impact";
      // The opening shot needs only these (preloaded by app/page.tsx): it looks back down the road, away from the street.
      const [road, barricade, man, walker] = await Promise.all([
        load("env-road"),
        load("barricade"),
        load("jump"),
        load("walk"),
        document.fonts.load(`300px ${font}`).catch(() => {}), // the title sign is drawn in it
      ]);
      // The street downloads while the first frame is built, without competing with it for bandwidth.
      const streetNames = ["env", ...TREES.map((t) => t.name), ...Object.keys(PEOPLE), "stall", "stall-keeper", "auto"];
      const deva = getComputedStyle(document.documentElement).getPropertyValue("--font-yatra").trim() || "serif";
      const skyLoad = new THREE.ImageBitmapLoader().loadAsync("/sky.jpg"); // decoded off the main thread
      skyLoad.catch(() => {}); // reported where it is awaited
      const shellLoad = fetch("/models/fireworks.bin").then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)));
      shellLoad.catch(() => {}); // reported where it is awaited
      const streetLoad = Promise.all([
        Promise.all(streetNames.map(load)),
        document.fonts.load(`100px ${deva}`, "चाय").catch(() => {}), // the stall banner's Hindi line
      ]);
      streetLoad.catch(() => {}); // reported where it is awaited
      if (dead) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      // Shadows, as the scene was lit in Blender: one soft-edged map thrown by the moonlight (see SHADOW).
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setSize(el.clientWidth, el.clientHeight); // sized now: each resize reallocates the canvas (~0.15 s)
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const q = () => new THREE.Quaternion();
      const v3 = () => new THREE.Vector3();
      let seed = 7;
      const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // seeded: the same street every visit
      const sparkTex = glowDot(); // firework sparks and street-lamp glows
      // A lit window: lamplight, brightest in the middle, behind a dark frame and its cross bars.
      const pane = document.createElement("canvas");
      pane.width = pane.height = 128;
      const pc = pane.getContext("2d")!;
      const lamp = pc.createRadialGradient(64, 70, 8, 64, 64, 90);
      lamp.addColorStop(0, "#fff");
      lamp.addColorStop(1, "#c8823c");
      pc.fillStyle = lamp;
      pc.fillRect(0, 0, 128, 128);
      pc.strokeStyle = "rgba(40,22,10,0.85)";
      pc.lineWidth = 10;
      pc.strokeRect(0, 0, 128, 128);
      pc.lineWidth = 6;
      pc.beginPath();
      pc.moveTo(64, 0);
      pc.lineTo(64, 128);
      pc.moveTo(0, 60);
      pc.lineTo(128, 60);
      pc.stroke();
      const paneTex = new THREE.CanvasTexture(pane);
      paneTex.colorSpace = THREE.SRGBColorSpace;

      // Sky and moon (see night.ts), kept on the camera by draw.
      const { dome, dispose: disposeSky } = nightSky(skyLoad, MOON, 0, () => dead);
      scene.background = new THREE.Color(HAZE);
      scene.fog = new THREE.Fog(HAZE, 60, 200); // far enough to see the tank and billboard at the end of the street
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
      scene.add(dome);
      // The street is lit by the sky photo itself (see skyEnvironment): the ambient light and every reflection come
      // out of the night sky, as a Blender scene lit by an HDRI does, which is why the environment's materials are
      // left as the PBR ones they were authored with rather than being flattened to Lambert. What is left of the
      // hemisphere light is a little lift in the shadows, under the sky's own.
      const disposeEnv = skyEnvironment(renderer, scene, skyLoad, 0, ENV_LIGHT, () => dead);
      // Moonlight, and a flash that takes each firework's colour as it bursts (no falloff: it lights the whole street).
      scene.add(new THREE.HemisphereLight(0x8a9ad0, 0x2a2238, 0.45));
      const moon = new THREE.DirectionalLight(0xb8c8ff, 1.75);
      moon.position.copy(SHADOW.from);
      moon.castShadow = true;
      moon.shadow.mapSize.setScalar(innerWidth < 900 ? SHADOW.small : SHADOW.map); // set once: resizing it reallocates
      moon.shadow.camera.near = 1;
      moon.shadow.camera.far = SHADOW.from.length() + SHADOW.span * 2;
      moon.shadow.camera.left = moon.shadow.camera.bottom = -SHADOW.span;
      moon.shadow.camera.right = moon.shadow.camera.top = SHADOW.span;
      moon.shadow.bias = SHADOW.bias;
      moon.shadow.normalBias = SHADOW.normalBias;
      scene.add(moon, moon.target);
      const flash = new THREE.PointLight(0xffffff, 0, 0, 0);
      scene.add(flash);

      // road, barricade and the street models keep their glTF PBR materials: scene.environment only reaches
      // MeshStandardMaterial, and flattening them to Lambert would cut them off from the sky's light.
      // Placed as the environment sits (see ENV).
      const placeEnv = (o: Object3D) => {
        const g = new THREE.Group().add(o);
        g.scale.setScalar(ENV.scale);
        g.rotation.y = Math.PI;
        g.position.set(0, ENV.y, ENV.z);
        return g;
      };
      // Road: the environment's tile, cloned along z to run past the fog.
      const tile = placeEnv(road.scene);
      const roadBox = new THREE.Box3().setFromObject(tile);
      const tileLen = roadBox.getSize(v3()).z;
      for (let i = -4; i < 5; i++) scene.add(tile.clone().translateZ(i * tileLen));
      const kerbTop = ENV.kerbTop;
      // Bare earth under everything, so gaps beside the road show ground instead of the sky's lower half.
      const earth = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: 0x9a8466 }));
      earth.rotation.x = -Math.PI / 2;
      earth.position.y = roadBox.min.y - 0.02; // just under the road
      scene.add(earth);

      // Title: "MERAZ 7.0" painted in the site's display font (Bungee) with a retro block shadow, on a sign standing
      // over the road behind his start. It fills the opening face-on shot; once the camera swings round it is behind it.
      const sign = document.createElement("canvas");
      sign.width = 2048;
      sign.height = 512;
      const ctx = sign.getContext("2d")!;
      ctx.font = `300px ${font}`;
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      const runs = [
        ["MERAZ ", "#d7263d"], // vermillion
        ["7.0", "#0f7c7c"], // teal
      ] as const;
      const widths = runs.map(([t]) => ctx.measureText(t).width);
      const fit = Math.min(1, (sign.width * 0.9) / widths.reduce((a, b) => a + b));
      ctx.font = `${300 * fit}px ${font}`;
      const paint = (dx: number, dy: number, fill?: string) => {
        let x = (sign.width - widths.reduce((a, b) => a + b) * fit) / 2;
        runs.forEach(([t, colour], i) => {
          ctx.fillStyle = fill ?? colour;
          ctx.fillText(t, x + dx, sign.height / 2 + dy);
          if (!fill) ctx.strokeText(t, x, sign.height / 2);
          x += widths[i] * fit;
        });
      };
      for (let d = 18; d > 0; d -= 2) paint(d, d, "#1a1a1a"); // block shadow, down-right
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 10;
      paint(0, 0);
      const signTex = new THREE.CanvasTexture(sign);
      signTex.colorSpace = THREE.SRGBColorSpace;
      signTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const title = new THREE.Mesh(
        new THREE.PlaneGeometry(TITLE.width, (TITLE.width * sign.height) / sign.width),
        new THREE.MeshBasicMaterial({ map: signTex, transparent: true, fog: false }),
      );
      title.position.set(0, TITLE.y, TITLE.z);
      scene.add(title);

      // Scale a model to a height, centre it on x/z with its base on y=0, and wrap it so it turns about that centre.
      const ground = (o: Object3D, height: number) => {
        o.scale.multiplyScalar(height / new THREE.Box3().setFromObject(o).getSize(v3()).y);
        const b = new THREE.Box3().setFromObject(o);
        const m = b.getCenter(v3());
        o.position.sub(v3().set(m.x, b.min.y, m.z));
        return new THREE.Group().add(o);
      };

      // Barricade: already spans the road (x); scaled so its top meets the hand, centred on x/z, feet on y=0.
      const box = new THREE.Box3().setFromObject(barricade.scene);
      barricade.scene.scale.setScalar(HAND_PLANT.y / box.getSize(v3()).y);
      box.setFromObject(barricade.scene);
      const c = box.getCenter(v3());
      barricade.scene.position.set(-c.x, -box.min.y, -c.z);
      const gate = new THREE.Group().add(barricade.scene);
      scene.add(gate);

      // The soldier's Walk and Idle, retargeted onto our rigs (see rig.ts).
      const { retarget, facesPlusZ, mixer: sMixer } = soldier(walker, STRIDE);

      // Runner.
      const rig = man.scene;
      scene.add(rig);
      const hips = bone(rig, "Hips");
      const head = bone(rig, "Head");
      rig.traverse((o) => (o.frustumCulled = false)); // skinned bounds stay at the start pose; root motion carries him out
      // Compiling the opening shot's shaders is the slowest part of the first frame. Start it now, in parallel where the
      // browser can (KHR_parallel_shader_compile), while his clips are prepared below; the first frame waits for it.
      const compiling = renderer.compileAsync(scene, camera);
      const mixer = new THREE.AnimationMixer(rig);
      const clip = man.animations.find((a) => a.name === "Flip jump") ?? man.animations[0];
      const action = mixer.clipAction(clip).play(); // the flip jump

      // Find where the hips peak (apex): framing and the reduced-motion still use it.
      const p = v3();
      const hipsAt = (t: number) => (mixer.setTime(t), rig.updateMatrixWorld(true), hips.getWorldPosition(p).clone());
      let apex = hipsAt(0);
      let apexT = 0;
      for (let t = 0; t < clip.duration; t += clip.duration / 40) {
        const at = hipsAt(t);
        if (at.y > apex.y) [apex, apexT] = [at, t];
      }
      mixer.setTime(0);

      const walkClip = retarget(rig);
      const walk = mixer.clipAction(walkClip).play();
      const idleClip = retarget(rig, "Idle"); // standing, once he stops
      const idle = mixer.clipAction(idleClip).play();

      // Pose the clips by hand: each action gets its own time and weight, then the mixer applies them.
      const pose = (walkT: number, jumpT: number, jumpW: number, idleW = 0, idleT = 0) => {
        walk.time = walkT % walkClip.duration;
        action.time = Math.min(jumpT, clip.duration - 1e-3); // at exactly duration it wraps to 0
        idle.time = idleT % idleClip.duration;
        walk.setEffectiveWeight((1 - jumpW) * (1 - idleW));
        action.setEffectiveWeight(jumpW * (1 - idleW));
        idle.setEffectiveWeight(idleW);
        mixer.update(0);
      };

      const speed = strideSpeed(rig, (t) => pose(t, 0, 0), walkClip.duration);
      const walkTime = WALK_CYCLES * walkClip.duration;
      const walkDist = speed * walkTime;
      const walkOnTime = WALK_ON_CYCLES * walkClip.duration;
      // How far the jump carries the hips past the walk's hips, so walking on picks up where he lands.
      pose(0, clip.duration, 1);
      const landOffset = hips.getWorldPosition(p).z;
      pose(0, 0, 0);
      const landGap = landOffset - hips.getWorldPosition(p).z;
      // Where he stops: the auto pulls up level with this.
      rig.position.z = walkDist + landGap + speed * walkOnTime;
      pose(walkOnTime, clip.duration, 0);
      const stopZ = hips.getWorldPosition(p).z;
      rig.position.z = 0;
      pose(0, 0, 0, 1);
      const standHips = hips.getWorldPosition(p).y;
      pose(0, 0, 0);

      // Sitting, layered on whatever the mixer posed: thighs forward, knees back, about his left-right axis (world x,
      // as he faces +z once seated). Parents first, so each knee bends from its already-raised thigh.
      const sitBones = (["LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg"] as const).map(
        (n) => [bone(rig, n), n.endsWith("UpLeg") ? -SIT_BEND.thigh : SIT_BEND.knee] as const,
      );
      const yAxis = v3().set(0, 1, 0);
      const sideAxis = v3();
      const spine = bone(rig, "Spine");
      const turnBone = (b: Object3D, angle: number) => {
        const w = b.getWorldQuaternion(q()).premultiply(q().setFromAxisAngle(sideAxis, angle));
        b.quaternion.copy(b.parent!.getWorldQuaternion(q()).invert().multiply(w));
        b.updateMatrixWorld(true);
      };
      const sitDown = (s: number, lean: number) => {
        sideAxis.set(1, 0, 0).applyAxisAngle(yAxis, rig.rotation.y); // his left-right axis, whichever way he faces
        if (s <= 0 && lean <= 0) return;
        rig.updateMatrixWorld(true);
        for (const [b, angle] of sitBones) turnBone(b, angle * s);
        turnBone(spine, SIT_BEND.duck * lean); // lean forward, head down
      };

      gate.position.set(apex.x, 0, walkDist + HAND_PLANT.z);
      // The auto's line: just clear of the barricade's end. His boarding, the seat, the eye camera and the driver all
      // follow from it.
      const autoX = apex.x + box.getSize(v3()).x / 2 + AUTO.half + AUTO.clear;

      // Re-letter the barricade: it ships with "DELHI POLICE" modelled as text on both faces of its sloped front panel
      // (the compressor merged the two into one mesh). The text is hidden and a painted "BHILAI POLICE" sign laid on
      // each face. The text spans the barricade's width (x), so its plane holds the x axis; its slope comes from a
      // line fit through the vertices seen side-on (y-z).
      gate.updateMatrixWorld(true);
      const letters: THREE.Mesh[] = [];
      barricade.scene.traverse((o) => /^Text/.test(o.name) && (o as THREE.Mesh).isMesh && letters.push(o as THREE.Mesh));
      for (const t of letters) {
        const pos = t.geometry.getAttribute("position");
        const pts = Array.from({ length: pos.count }, (_, i) => v3().fromBufferAttribute(pos, i).applyMatrix4(t.matrixWorld));
        const mid = pts.reduce((s, x) => s.add(x), v3()).divideScalar(pts.length);
        let [yy, zz, yz] = [0, 0, 0];
        for (const x of pts) [yy, zz, yz] = [yy + (x.y - mid.y) ** 2, zz + (x.z - mid.z) ** 2, yz + (x.y - mid.y) * (x.z - mid.z)];
        const slope = 0.5 * Math.atan2(2 * yz, yy - zz); // direction of the text's "up" in the y-z plane
        const up = v3().set(0, Math.cos(slope), Math.sin(slope));
        if (up.y < 0) up.negate();
        const [x0, x1] = [Math.min(...pts.map((x) => x.x)), Math.max(...pts.map((x) => x.x))];
        const along = pts.map((x) => x.clone().sub(mid).dot(up));
        const [v0, v1] = [Math.min(...along), Math.max(...along)];
        const [w, h] = [x1 - x0, v1 - v0];
        const centre = mid
          .clone()
          .setX((x0 + x1) / 2)
          .addScaledVector(up, (v0 + v1) / 2);
        const art = document.createElement("canvas");
        art.width = 1024;
        art.height = Math.round((1024 * h) / w);
        const g2 = art.getContext("2d")!;
        g2.fillStyle = "#" + (t.material as THREE.MeshStandardMaterial).color.getHexString();
        g2.textAlign = "center";
        g2.textBaseline = "middle";
        g2.font = `bold ${art.height}px "Arial Black", Impact, sans-serif`;
        g2.font = `bold ${art.height * Math.min(1, (art.width * 0.98) / g2.measureText("BHILAI POLICE").width)}px "Arial Black", Impact, sans-serif`;
        g2.fillText("BHILAI POLICE", art.width / 2, art.height / 2);
        const tex = new THREE.CanvasTexture(art);
        tex.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshLambertMaterial({ map: tex, transparent: true });
        for (const normal of [v3().set(1, 0, 0).cross(up), v3().set(-1, 0, 0).cross(up)]) {
          const decal = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
          decal.matrix.makeBasis(up.clone().cross(normal), up, normal); // plane x right, y up, z out of the face
          decal.matrix.setPosition(centre.clone().addScaledVector(normal, 0.01)); // just proud of the panel
          decal.matrix.decompose(decal.position, decal.quaternion, decal.scale);
          gate.attach(decal);
        }
        t.visible = false;
      }

      const walkers: { g: Object3D; mixer: THREE.AnimationMixer; z0: number; v: number }[] = [];
      let auto: Object3D | undefined;
      let driverHead: Object3D | undefined;
      let clock = 0;
      const stroll = (dt: number) => {
        clock += dt;
        for (const w of walkers) {
          w.g.position.z = WALKWAY.from + ((((w.z0 + w.v * clock) % WALKWAY.len) + WALKWAY.len) % WALKWAY.len);
          w.mixer.update(dt);
        }
      };
      stroll(0);

      // Fireworks (see night.ts); each burst flashes the street in its colour.
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const shows = fireworkShows(SHOWS, sparkTex, flash, reduce);
      scene.add(shows.sparks);
      const fireworks = shows.update;
      const buildFireworks = shows.build;

      // First he walks toward the camera while it swings from a close-up of his face, round his side, out to a
      // chase position behind him. Then the jump clip plays (blending in from the walk), then he blends back into
      // the walk for two steps and stands. The camera rides behind the hips; x and height stay fixed so the flip does not
      // sway it. Narrow screens pull it back (zoom).
      const lerp = THREE.MathUtils.lerp;
      const f = v3();
      let zoom = 1;
      let rideFrom = -1; // performance.now() when a destination was picked
      let rideZ = 0; // how far the auto has gone since
      let rideV = 0;
      const draw = (scrolled: number) => {
        const at = rideFrom < 0 ? scrolled : 1; // once riding, he stays seated whatever the scroll does
        const w = at / ORBIT; // walk progress, keeps running through the blend
        const clamp01 = (x: number) => THREE.MathUtils.clamp(x, 0, 1);
        const jump = clamp01((at - ORBIT) / (LAND - ORBIT));
        const on = clamp01((at - LAND) / (STOP - LAND)); // the two steps after landing
        const back = clamp01((at - LAND) / BLEND); // jump -> walk
        // Boarding, as people get into an auto: no stop. He walks on along a curve that bends him round, a little at
        // a time, until he faces the auto's open side; then ducks into the sitting pose, slides in and back onto the
        // middle of the bench (so his head stays under the roof and his legs fold away), turning forward as he settles.
        const ease = (t: number) => t * t * (3 - 2 * t);
        const board = clamp01((at - STOP) / (SIT - STOP));
        const arc = clamp01(board / 0.45); // walking the curve to the opening
        const arrive = ease(clamp01((board - 0.4) / 0.08)); // walk -> standing as he reaches it
        const sit = ease(clamp01((board - 0.45) / 0.12)); // drop into the sitting pose before reaching the opening
        const slide = ease(clamp01((board - 0.52) / 0.33)); // slide in through the opening and back onto the bench
        const duck = Math.sin(Math.PI * slide); // lean lowest while passing under the roof edge
        const forward = ease(clamp01((board - 0.68) / 0.32)); // turns slowly to face forward as he settles onto the bench
        const autoZ = stopZ + AUTO.ahead + rideZ;
        const bob = 0.012 * Math.sin(rideZ * 3) * Math.min(rideV / 3, 1); // the road under a moving auto
        const seat = v3().set(autoX, 0, autoZ + SEAT.z); // middle of the bench
        const door = v3().set(seat.x - SEAT.outside, 0, autoZ + SEAT.entry); // where he arrives outside the opening
        // The curve: a cubic from his last step (heading +z) to the opening (heading +x), relative to his last step.
        const end = v3().set(door.x - apex.x, 0, door.z - stopZ);
        const bend = 0.55 * Math.min(end.x, end.z);
        const curve = (t: number) => {
          const [b, cc, d] = [3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3]; // control points (0,0) (0,bend) (end.x-bend,end.z) end
          return v3().set(cc * (end.x - bend) + d * end.x, 0, b * bend + (cc + d) * end.z);
        };
        const along = curve(arc);
        const heading = curve(Math.min(arc + 0.01, 1)).sub(curve(Math.max(arc - 0.01, 0))); // direction of travel
        const arcLen = Array.from({ length: 8 }, (_, i) => curve((i + 1) / 8).distanceTo(curve(i / 8))).reduce((s, d) => s + d);
        rig.rotation.y = (arc < 1 ? Math.atan2(heading.x, heading.z) : Math.PI / 2) - (Math.PI / 2) * forward;
        rig.position.set(
          along.x + SEAT.outside * slide,
          (SEAT.hips - standHips) * sit + bob,
          Math.min(w, 1) * walkDist + back * landGap + speed * on * walkOnTime + along.z + (seat.z - door.z) * slide,
        );
        pose(
          on > 0 ? on * walkOnTime + (arc * arcLen) / speed : w * walkTime,
          jump * clip.duration,
          clamp01((at - ORBIT) / BLEND) * (1 - back),
          arrive,
          Math.max(0, at - STOP) * 20, // idle sways on once he has stopped walking
        );
        sitDown(sit, duck);
        // Pin him to the middle of the bench as he slides on (turning about the rig's origin would shift him).
        if (slide > 0) {
          const hp = hips.getWorldPosition(v3());
          rig.position.x += (seat.x - hp.x) * slide;
          rig.position.z += (seat.z - hp.z) * slide;
          rig.updateMatrixWorld(true);
        }
        // The auto pulls away from its wait up the road as he sets off, easing up to speed and then into its stop just
        // ahead of him as he lands his steps; on the way it merges in from the kerb, finished well before the barricade,
        // turning a little as it steers.
        if (auto) {
          const along = clamp01(at / STOP);
          const az = lerp(AUTO.start, autoZ, along * along * (3 - 2 * along));
          const wait = Math.min(autoX + AUTO.out, ENV.edge - AUTO.half - 0.3); // out toward the kerb, never onto it
          const lane = (zz: number) => lerp(wait, autoX, THREE.MathUtils.smoothstep(zz, gate.position.z - 9, gate.position.z - 2));
          auto.position.set(lane(az), bob, az);
          auto.rotation.y = Math.atan2(lane(az + 0.5) - lane(az), 0.5); // facing along its path (+z, bending in)
        }
        const o = Math.min(w, 1);
        const u = o * o * (3 - 2 * o); // ease in and out of the swing
        const z = hips.getWorldPosition(p).z;
        head.getWorldPosition(f);
        // Swing round a pivot that slides from his face to the chase line along the road; the jump pushes it in.
        const push = ease(clamp01((at - ORBIT) / 0.06));
        const x = lerp(f.x, apex.x, u);
        const pz = lerp(f.z, z, u);
        const r = lerp(1.4 * zoom, 7 * zoom, u) * lerp(1, CAMERA.push, push);
        const a = Math.PI * u; // 0 = in front of him (he faces +z), PI = behind
        // sideways reach stays inside the carriageway so the swing never passes through a lamp post or railing
        camera.position.set(
          x + Math.min(r * Math.sin(a), ENV.edge - 0.5),
          lerp(f.y, 1 + 1.2 * zoom * lerp(1, CAMERA.push, push), u),
          pz + r * Math.cos(a),
        );
        const aim = v3().set(x, lerp(f.y + 1.4 * zoom * TITLE.tilt, lerp(0.8, CAMERA.aim, push), u), pz + 1.5 * u);
        // Boarding camera: as he curves round to the auto it moves in just behind his head, looking where he looks; as he
        // takes his first step in (starts to sit) it cuts into his eyes, wide lens, and stays there: in through the
        // open side, onto the bench, then over the driver down the road.
        const facing = v3().set(Math.sin(rig.rotation.y), 0, Math.cos(rig.rotation.y));
        const behind = ease(clamp01(board / 0.3));
        const eyes = ease(clamp01((board - 0.45) / 0.05));
        const nape = f
          .clone()
          .addScaledVector(facing, -CAMERA.behind)
          .setY(f.y + CAMERA.over);
        const gaze = f
          .clone()
          .addScaledVector(facing, 3)
          .setY(f.y - 0.3);
        // Eyes ride on his hips, not his head: ducking tips the head into the bench and the auto's side. Hips to eyes is
        // about 0.5 m standing or seated; lift raises the view once seated, to see over the driver to the handlebar.
        const hp = hips.getWorldPosition(v3());
        const eye = hp.addScaledVector(facing, CAMERA.eye).setY(hp.y + 0.5 + CAMERA.lift * sit);
        eye.x = lerp(eye.x, seat.x, forward); // once he faces forward, look from the middle of the auto, down its centre line
        const ahead = eye
          .clone()
          .addScaledVector(facing, 5)
          .setY(eye.y - 0.4);
        ahead.x = lerp(ahead.x, seat.x, forward);
        camera.position.lerp(nape, behind).lerp(eye, eyes);
        aim.lerp(gaze, behind).lerp(ahead, eyes);
        rig.visible = eyes < 0.05; // the eye camera sits inside him: hide him as soon as it cuts in
        // wider in his eyes, to take in the auto and the road ahead; wider still as the ride picks up speed
        const fov = lerp(40, CAMERA.eyeFov, eyes) + RIDE.fov * Math.min(rideV / 10, 1);
        if (camera.fov !== fov) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
        camera.lookAt(aim);
        dome.position.copy(camera.position);
        // The shadow camera rides with him: it is only wide enough for the road around him, so it has to keep up.
        moon.target.position.set(rig.position.x, 0, rig.position.z);
        moon.position.copy(moon.target.position).add(SHADOW.from);
        moon.target.updateMatrixWorld();
        renderer.render(scene, camera);
        // Driver's question and the destinations: shown by data attributes on the section, styled in the markup.
        // Reduced motion never scrolls, so its destinations stay up; once riding, the question and destinations go.
        const riding = rideFrom >= 0;
        const [ask, go] = riding ? [false, false] : [!reduce && at >= ASK, reduce || at >= GO];
        if (sec.hasAttribute("data-ask") !== ask) sec.toggleAttribute("data-ask", ask);
        if (sec.hasAttribute("data-go") !== go) sec.toggleAttribute("data-go", go);
        const moved = reduce || at > 0.02; // the scroll hint goes once scrolling starts (reduced motion has none)
        if (sec.hasAttribute("data-moved") !== moved) sec.toggleAttribute("data-moved", moved);
        const asked = riding || at >= ASK; // nothing left to skip
        if (sec.hasAttribute("data-asked") !== asked) sec.toggleAttribute("data-asked", asked);
        if (ask && driverHead) {
          const s = driverHead.getWorldPosition(v3()).project(camera); // the bubble's tail points at the top of his head
          tip.style.setProperty("--x", `${((s.x + 1) / 2) * el.clientWidth}px`);
          tip.style.setProperty("--y", `${((1 - s.y) / 2) * el.clientHeight}px`);
        }
      };

      let progress = 0;
      const resize = () => {
        const size = renderer.getSize(new THREE.Vector2());
        if (size.x !== el.clientWidth || size.y !== el.clientHeight) renderer.setSize(el.clientWidth, el.clientHeight);
        camera.aspect = el.clientWidth / el.clientHeight;
        camera.updateProjectionMatrix();
        zoom = Math.max(1, 0.8 / camera.aspect);
        // shrink the title sign if the opening shot is too narrow to show all of it
        const seen = 2 * (1.4 * zoom - TITLE.z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
        title.scale.setScalar(Math.min(1, (0.9 * seen) / TITLE.width));
        draw(progress);
      };
      // Upload the textures while the shaders compile, rather than in the first frame.
      scene.traverse((o) => {
        for (const m of [(o as THREE.Mesh).material ?? []].flat())
          for (const v of Object.values(m)) if ((v as THREE.Texture | null)?.isTexture) renderer.initTexture(v);
      });
      await Promise.all([compiling, renderer.compileAsync(gate, camera, scene)]); // with the lettering added since
      if (dead) {
        renderer.dispose();
        renderer.domElement.remove();
        return;
      }
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      if (reduce) progress = ORBIT + (LAND - ORBIT) * (apexT / clip.duration); // still frame mid-flip over the barricade
      resize();
      shellLoad
        .then((buf) => {
          if (dead) return;
          buildFireworks(buf);
          if (reduce) draw(progress); // no frame loop to show them
        })
        .catch((e) => console.error("RoadJump fireworks:", e));
      // Pin the section and scrub the beats across 6 screens of scrolling; the frame loop draws them.
      const st = reduce
        ? null
        : ScrollTrigger.create({
            trigger: pin.current,
            start: "top top",
            end: "+=600%",
            pin: true,
            scrub: true,
            onUpdate: (self) => (progress = self.progress),
          });
      // Pedestrians and fireworks need a frame loop; run it only while the section is on screen (never for reduced motion).
      let last = 0;
      const io = new IntersectionObserver(([e]) => {
        last = performance.now();
        renderer.setAnimationLoop(
          e.isIntersecting && !reduce
            ? (now) => {
                const dt = Math.min((now - last) / 1000, 0.1);
                stroll(dt);
                fireworks(dt);
                last = now;
                if (rideFrom >= 0) {
                  const t = (now - rideFrom) / 1000;
                  [rideZ, rideV] = [0.5 * RIDE.accel * t * t, RIDE.accel * t];
                }
                draw(progress);
              }
            : null,
        );
      });
      io.observe(el);
      // The ride needs the frame loop, so reduced motion leaves ride unset and the links navigate as usual.
      let rideTimer = 0;
      if (!reduce)
        ride.current = (href) => {
          if (rideFrom >= 0) return;
          rideFrom = performance.now();
          rideTimer = window.setTimeout(() => goTo(href, "white"), RIDE.fade * 1000);
        };

      // Skip: scrolls the page by itself to just past GO, easing in and out; any scrolling of the visitor's takes over.
      if (st)
        skip.current = () => {
          const y = st.start + (GO + 0.005) * (st.end - st.start);
          const left = y - window.scrollY;
          if (left <= 0) return;
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(y, { duration: (left / window.innerHeight) * SKIP_PACE, easing: (t) => (1 - Math.cos(Math.PI * t)) / 2 });
          else window.scrollTo({ top: y, behavior: "smooth" });
        };

      cleanup = () => {
        ride.current = null;
        skip.current = null;
        clearTimeout(rideTimer);
        io.disconnect();
        renderer.setAnimationLoop(null);
        st?.kill(true);
        ro.disconnect();
        mixer.stopAllAction();
        walkers.forEach((w) => w.mixer.stopAllAction());
        sMixer.stopAllAction();
        scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            [o.material].flat().forEach((m) => m.dispose());
          }
        });
        signTex.dispose();
        disposeSky();
        disposeEnv();
        shows.dispose();
        sparkTex.dispose();
        paneTex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };

      // The street: everything else, added in one go once it has landed (shaders compiled off the main path first).
      const [streetModels] = await streetLoad;
      if (dead) return;
      const model = (n: string) => streetModels[streetNames.indexOf(n)];
      // The billboard is lit at night: its board and movie posters glow with their own pictures.
      model("env").scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshLambertMaterial | undefined;
        if (!m?.map || !/billboard|poster|^MV5B/.test(m.name)) return;
        m.emissive.set(0xffffff);
        m.emissiveMap = m.map;
        m.emissiveIntensity = m.name.startsWith("billboard") ? 0.4 : 0.8;
      });
      // Lights on in the houses (see WINDOWS): a warm pane over each street-facing window with a soft glow in front of
      // it, on each building and its twin across the road; the rows repeated below copy them along.
      const envRoot = model("env").scene;
      envRoot.updateMatrixWorld(true);
      const paneGeo = new THREE.PlaneGeometry(1, 1);
      const paneMats = WINDOW_TINTS.map((c) => new THREE.MeshBasicMaterial({ map: paneTex, color: c }));
      const haloMats = WINDOW_TINTS.map(
        (c) => new THREE.SpriteMaterial({ map: sparkTex, color: c, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      let lit = 0;
      for (const [name, list] of Object.entries(WINDOWS)) {
        const house = envRoot.getObjectByName(name);
        if (!house) continue;
        const panes = new THREE.Group();
        for (const [x, y, z, w, h] of list) {
          const tint = lit++ % WINDOW_TINTS.length;
          const glass = new THREE.Mesh(paneGeo, paneMats[tint]);
          glass.position.set(x + 0.03, y, z); // just off the wall
          glass.rotation.y = Math.PI / 2; // facing +x, the road
          glass.scale.set(w, h, 1);
          const halo = new THREE.Sprite(haloMats[tint]);
          halo.position.set(x + 0.4, y, z);
          halo.scale.set(w * 2.2, h * 2.2, 1);
          panes.add(glass, halo);
        }
        house.attach(panes); // placed as measured, in the environment's space
        envRoot.getObjectByName(`${name}001`)?.add(panes.clone()); // the twin: the same spot on the same building
      }
      // The street's ~20 shader programs take about a second to compile. Start them now, from the models as loaded
      // (clones share their materials), so they compile while the street is laid out below rather than after.
      const streetCompiling = Promise.all(streetModels.map((m) => renderer.compileAsync(m.scene, camera, scene)));
      const street = new THREE.Group();
      // Lay out the environment (in its own units, before it is placed): repeat the house rows, push the vista on.
      const envScene = model("env").scene;
      for (const o of [...envScene.children]) {
        if (VISTA.test(o.name)) o.position.z -= ENV.vista / ENV.scale; // the street runs toward -z in model units
        if (!HOUSE_ROW.test(o.name)) continue;
        for (const k of [1, 2]) {
          const copy = o.clone();
          copy.position.z += k * ENV.row;
          envScene.add(copy);
        }
      }
      const envPlaced = placeEnv(envScene);
      street.add(envPlaced);
      envPlaced.updateMatrixWorld(true);

      // Stall: counter facing the road (it faces +x as modelled), back against the wall line, level with the barricade.
      const stall = ground(model("stall").scene, STALL.height);
      const stallSize = new THREE.Box3().setFromObject(stall).getSize(v3());
      const depth = stallSize.x;
      stall.position.set(STALL.back + depth / 2, kerbTop, gate.position.z);
      street.add(stall);
      const stallZ = stall.position.z;

      // Trees: at random spots along each footpath, random turn and size, clear of the environment and the stall.
      const trees = TREES.map((t) => ground(model(t.name).scene, t.size));
      for (const side of [-1, 1]) {
        for (let z = STREET.from + rand() * 10; z < STREET.to; z += 9 + rand() * 14) {
          if (PATHS[side].trees.some(([a, b]) => z > a && z < b)) continue;
          if (side < 0 && Math.abs(z - stallZ) < stallSize.z / 2 + 1.5) continue;
          const t = trees[Math.floor(rand() * trees.length)].clone();
          t.position.set(PATHS[side].tree, kerbTop, z);
          t.rotation.y = rand() * Math.PI * 2;
          t.scale.setScalar(0.85 + rand() * 0.3);
          street.add(t);
        }
      }

      // Street lights: the environment's lamp post, copied along both kerbs with its arm out over the road, each lamp
      // glowing warm with a pool of light on the road under it. Its mesh holds two posts at opposite ends of the
      // street; only the near one's triangles are kept. That post stands at the +x end of its arm.
      const posts = envScene.getObjectByName("streetLight_environemnt_0") as THREE.Mesh;
      const all = posts.geometry.index ? posts.geometry.toNonIndexed() : posts.geometry;
      const corner = all.getAttribute("position");
      const near: number[] = []; // first vertex of each kept triangle
      for (let i = 0; i < corner.count; i += 3)
        if (v3().fromBufferAttribute(corner, i).applyMatrix4(posts.matrixWorld).z < ENV.z) near.push(i);
      const one = new THREE.BufferGeometry();
      for (const [name, attr] of Object.entries(all.attributes) as [string, THREE.BufferAttribute][]) {
        const n = attr.itemSize * 3;
        const arr = new (attr.array.constructor as Float32ArrayConstructor)(near.length * n);
        near.forEach((i, k) => arr.set(attr.array.subarray(i * attr.itemSize, i * attr.itemSize + n), k * n));
        one.setAttribute(name, new THREE.BufferAttribute(arr, attr.itemSize, attr.normalized));
      }
      const body = new THREE.Mesh(one, posts.material);
      posts.matrixWorld.decompose(body.position, body.quaternion, body.scale); // where the post stands, as a root
      const pb = new THREE.Box3().setFromObject(body);
      const foot = v3().set(pb.max.x - 0.1, pb.min.y, (pb.min.z + pb.max.z) / 2);
      body.position.sub(foot);
      const bulb = v3().set(pb.min.x + 0.15, pb.max.y - 0.25, foot.z).sub(foot);
      const lampGlow = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: sparkTex, color: 0xffc070, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      lampGlow.position.copy(bulb);
      lampGlow.scale.setScalar(1.8);
      const pool = new THREE.Mesh(
        new THREE.PlaneGeometry(7, 7).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ map: sparkTex, color: 0x8a5a20, blending: THREE.AdditiveBlending,
          transparent: true, depthWrite: false }),
      );
      pool.position.set(bulb.x, 0.03 - kerbTop, 0); // on the road
      const lampKit = new THREE.Group().add(body, lampGlow, pool);
      for (const side of [-1, 1]) {
        for (let z = STREET.from + (side > 0 ? LAMP_GAP / 2 : 0); z < STREET.to; z += LAMP_GAP) {
          if (PATHS[side].lamps.some(([a, b]) => z > a && z < b)) continue;
          const lamp = lampKit.clone();
          lamp.position.set(PATHS[side].lamp, kerbTop, z);
          lamp.rotation.y = side > 0 ? 0 : Math.PI; // arm over the road
          street.add(lamp);
        }
      }

      // Banner on the front of the counter, below the keeper, facing the road: a painted board in the site's retro style.
      const board = document.createElement("canvas");
      board.width = 1024;
      board.height = 300;
      const bc = board.getContext("2d")!;
      bc.fillStyle = "#f2c14e"; // turmeric
      bc.fillRect(0, 0, board.width, board.height);
      bc.strokeStyle = "#1a1a1a";
      bc.lineWidth = 16;
      bc.strokeRect(8, 8, board.width - 16, board.height - 16);
      bc.textAlign = "center";
      bc.textBaseline = "middle";
      bc.font = `120px ${font}`;
      bc.font = `${120 * Math.min(1, 900 / bc.measureText("CHAI KI TAPRI").width)}px ${font}`;
      bc.fillStyle = "#1a1a1a";
      bc.fillText("CHAI KI TAPRI", board.width / 2 + 6, 112 + 6); // block shadow
      bc.fillStyle = "#d7263d"; // vermillion
      bc.fillText("CHAI KI TAPRI", board.width / 2, 112);
      bc.font = `72px ${deva}`;
      bc.fillStyle = "#1a1a1a";
      bc.fillText("चाय की टपरी", board.width / 2, 222);
      const boardTex = new THREE.CanvasTexture(board);
      boardTex.colorSpace = THREE.SRGBColorSpace;
      const bannerW = stallSize.z * 0.85;
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(bannerW, (bannerW * board.height) / board.width),
        new THREE.MeshLambertMaterial({ map: boardTex, side: THREE.DoubleSide }),
      );
      banner.rotation.y = Math.PI / 2; // plane faces +z; turn it to the road (+x)
      banner.position.set(stall.position.x + depth / 2 + 0.03, kerbTop + 0.55, stallZ);
      street.add(banner);
      const keeper = ground(model("stall-keeper").scene, STALL.keeper);
      keeper.rotation.y = Math.PI / 2; // faces +z as modelled; turn him to the road (+x)
      keeper.position.set(stall.position.x - depth * 0.2, kerbTop + STALL.keeperBase, stall.position.z);
      street.add(keeper);
      // The stall's bulb (see STALL.lamp), with a soft halo so it reads from down the street like the street lights.
      const { lamp: sl } = STALL;
      const stallLamp = new THREE.PointLight(sl.tint, sl.power, sl.reach, sl.decay);
      stallLamp.position.set(stall.position.x + depth / 2 + sl.out, kerbTop + sl.up, stallZ);
      const stallHalo = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: sparkTex, color: sl.tint, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      stallHalo.scale.setScalar(sl.halo);
      stallHalo.position.copy(stallLamp.position);
      street.add(stallLamp, stallHalo);

      auto = ground(model("auto").scene, AUTO.height); // faces +z as modelled, the way he walks
      auto.position.x = autoX;
      street.add(auto);
      // The bulb autos run under their roof at night, here a warm cream white. It rides
      // with the auto, so it still lights the cabin once he is aboard and it pulls away; its falloff is kept short so
      // it washes the roof, the bench and the driver's back without spilling out onto the road.
      const cabin = new THREE.PointLight(CABIN.tint, CABIN.power, CABIN.reach, CABIN.decay);
      cabin.position.set(0, CABIN.y, CABIN.z);
      auto.add(cabin);
      // and the fitting it comes from: a small bright pane on the underside of the roof, with a soft halo in front of
      // it so the tube still reads from down the street, the way the houses' windows do.
      const cabinPane = new THREE.Mesh(
        new THREE.PlaneGeometry(CABIN.size, CABIN.size * 0.45).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(CABIN.tint).multiplyScalar(0.6), fog: false }), // dimmed, a low bulb
      );
      cabinPane.position.set(0, CABIN.roof, CABIN.z);
      const cabinHalo = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: sparkTex, color: CABIN.tint, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
      );
      cabinHalo.scale.setScalar(CABIN.halo);
      cabinHalo.position.copy(cabinPane.position);
      auto.add(cabinPane, cabinHalo);

      // Pedestrians. Man and old man walk with their own clips, root motion stripped so the lane sets the pace; the
      // woman's own clip is an idle, so she borrows the soldier walk like the runner.
      const types = Object.fromEntries(
        Object.entries(PEOPLE).map(([who, height]) => {
          const g = ground(model(who).scene, height);
          g.updateMatrixWorld(true);
          const m = new THREE.AnimationMixer(g);
          let walkOf: THREE.AnimationClip;
          let pace: number;
          let yaw: number;
          if (who === "woman") {
            walkOf = retarget(g);
            const a = m.clipAction(walkOf).play();
            pace = strideSpeed(g, (t) => ((a.time = t), m.update(0)), walkOf.duration);
            yaw = facesPlusZ((n) => bone(g, n).getWorldPosition(v3())) ? 0 : Math.PI;
          } else {
            walkOf = model(who).animations[0];
            m.clipAction(walkOf).play();
            const hz = (t: number) => (m.setTime(t), bone(g, "Hips").getWorldPosition(v3()).z);
            const travel = hz(walkOf.duration - 1e-3) - hz(0);
            pace = Math.abs(travel) / walkOf.duration;
            yaw = travel > 0 ? 0 : Math.PI;
            // strip the forward drift from the hips track so he walks in place
            const track = walkOf.tracks.find((t) => t.name.endsWith(".position") && key(t.name.slice(0, -9)) === "Hips")!;
            const [v, tt] = [track.values, track.times];
            const n = tt.length;
            for (let i = 0; i < n; i++)
              for (let a = 0; a < 3; a++) v[i * 3 + a] -= ((v[(n - 1) * 3 + a] - v[a]) * (tt[i] - tt[0])) / (tt[n - 1] - tt[0]);
          }
          // Set the feet on the ground mid-walk: the bind pose the model was grounded in stands at another height.
          const a = m.clipAction(walkOf).play();
          let low = Infinity;
          for (let i = 0; i < 6; i++) {
            a.time = (i / 6) * walkOf.duration;
            m.update(0);
            g.updateMatrixWorld(true);
            low = Math.min(low, new THREE.Box3().setFromObject(g, true).min.y);
          }
          g.children[0].position.y -= low;
          m.stopAllAction();
          return [who, { model: g, clip: walkOf, pace, yaw }];
        }),
      );
      for (const lane of LANES) {
        const speed = lane.mix.reduce((s, who) => s + types[who].pace, 0) / lane.mix.length; // the lane's one speed
        const [gapMin, gapMax] = lane.gap;
        // random gaps; the one across the wrap is kept at least gapMin too
        for (let z = rand() * gapMin; z < WALKWAY.len - gapMin; z += gapMin + rand() * (gapMax - gapMin)) {
          const t = types[lane.mix[Math.floor(rand() * lane.mix.length)]];
          const g = cloneRig(t.model);
          g.position.set(PATHS[lane.side].lane, kerbTop, 0);
          g.rotation.y = t.yaw + (lane.dir > 0 ? 0 : Math.PI);
          const m = new THREE.AnimationMixer(g);
          m.clipAction(t.clip).play().timeScale = speed / t.pace; // steps match the lane speed, so feet do not slide
          m.setTime(rand() * t.clip.duration); // out of step with each other
          walkers.push({ g, mixer: m, z0: z, v: lane.dir * speed });
          street.add(g);
        }
      }
      // Driver: a copy of the old man (the walking man's texture shows white seams up close), held mid-stride, then
      // posed seated by pointing each limb bone (at its child bone) along a direction: back leant forward, thighs along
      // the seat, shins down, arms reaching to the grips.
      const driver = cloneRig(types.oldman.model);
      driver.rotation.y = types.oldman.yaw; // face +z, the way the auto drives
      driver.scale.setScalar(DRIVER.scale);
      auto.add(driver);
      auto.updateMatrixWorld(true);
      const pointBone = (n: string, child: string, dir: THREE.Vector3) => {
        const b = bone(driver, n);
        const from = bone(driver, child).getWorldPosition(v3()).sub(b.getWorldPosition(v3())).normalize();
        const w = b.getWorldQuaternion(q()).premultiply(q().setFromUnitVectors(from, dir.clone().normalize()));
        b.quaternion.copy(b.parent!.getWorldQuaternion(q()).invert().multiply(w));
        b.updateMatrixWorld(true);
      };
      const dHips = bone(driver, "Hips");
      driver.position.add(auto.localToWorld(v3().set(0, DRIVER.hips, DRIVER.z)).sub(dHips.getWorldPosition(v3())));
      driver.updateMatrixWorld(true);
      // Straighten each link of the back (the walk pose curls it), then hold the head up, looking down the road.
      const lean = v3().set(0, Math.cos(DRIVER.lean), Math.sin(DRIVER.lean));
      for (const [n, child] of [["Spine", "Spine1"], ["Spine1", "Spine2"], ["Spine2", "Neck"]]) pointBone(n, child, lean);
      for (const [n, child] of [["Neck", "Head"], ["Head", "HeadTop_End"]]) pointBone(n, child, v3().set(0, 1, 0.1));
      for (const s of ["Left", "Right"]) {
        const side = Math.sign(bone(driver, `${s}UpLeg`).getWorldPosition(v3()).x - dHips.getWorldPosition(v3()).x);
        pointBone(`${s}UpLeg`, `${s}Leg`, v3().set(side * 0.15, 0, 1)); // knees a little apart
        pointBone(`${s}Leg`, `${s}Foot`, v3().set(0, -1, DRIVER.shin));
        // Arm: two-bone reach, elbow bent down and out, so the wrist lands on the grip (or as near as the arm allows).
        const [arm, fore, hand] = [`${s}Arm`, `${s}ForeArm`, `${s}Hand`].map((n) => bone(driver, n).getWorldPosition(v3()));
        const [a, b] = [arm.distanceTo(fore), fore.distanceTo(hand)];
        const grip = auto.localToWorld(v3().set(side * DRIVER.grip.x, DRIVER.grip.y, DRIVER.grip.z));
        const toGrip = grip.clone().sub(arm);
        const d = Math.min(toGrip.length(), (a + b) * 0.999);
        const reach = toGrip.normalize();
        const out = v3().set(side * 0.5, -1, 0);
        const bendDir = out.sub(reach.clone().multiplyScalar(out.dot(reach))).normalize();
        const elbow = Math.acos(THREE.MathUtils.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
        pointBone(`${s}Arm`, `${s}ForeArm`, reach.clone().multiplyScalar(Math.cos(elbow)).addScaledVector(bendDir, Math.sin(elbow)));
        pointBone(`${s}ForeArm`, `${s}Hand`, grip.sub(bone(driver, `${s}ForeArm`).getWorldPosition(v3())));
      }
      driverHead = bone(driver, "HeadTop_End");

      await Promise.all([streetCompiling, renderer.compileAsync(street, camera, scene)]); // and the banner's
      if (dead) return;
      scene.add(street);
      // Everything on the road casts and catches shadows, except the sky dome (a 250 m sphere: it would shadow the
      // whole street) and the flat sprites and billboards, which are lit by their own textures and have no depth to
      // throw. Whatever stands outside the shadow camera as it rides past is culled from the map's pass anyway.
      scene.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh) return;
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        o.receiveShadow = true;
        o.castShadow = o !== dome && !(m && !Array.isArray(m) && (m as THREE.MeshBasicMaterial).isMeshBasicMaterial);
      });
      earth.castShadow = false; // it is the ground: it only catches them
      stroll(0);
      draw(progress); // place the auto and walkers now; without the frame loop (reduced motion) nothing else would
      // The scene is complete: in idle moments from here, warm the events and contact pages (see warmup.ts). Their
      // fireworks, sky, moon and runner are this page's own, already cached.
      unwarm = warmUp(["/events", "/contact"], (href) => router.prefetch(href), [
        melaModel,
        "/models/telephone.glb",
        "/models/stool.glb",
      ]);
    })().catch((e) => console.error("RoadJump:", e));

    // Keyboard: hold W to scroll on down the scene, S to scroll back up (not while typing, nor with modifier keys).
    let keyDir = 0;
    let keyFrame = 0;
    let keyLast = 0;
    const roll = (now: number) => {
      window.scrollBy(0, keyDir * KEY_SCROLL * Math.min((now - keyLast) / 1000, 0.05));
      keyLast = now;
      keyFrame = requestAnimationFrame(roll);
    };
    const stop = () => {
      keyDir = 0;
      cancelAnimationFrame(keyFrame);
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = e.code === "KeyW" ? 1 : e.code === "KeyS" ? -1 : 0;
      const t = e.target as HTMLElement;
      if (!dir || e.ctrlKey || e.metaKey || e.altKey || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
        return;
      e.preventDefault();
      if (e.type === "keyup") return void (keyDir === dir && stop());
      if (keyDir === dir) return; // held down: already rolling
      stop();
      keyDir = dir;
      keyLast = performance.now();
      keyFrame = requestAnimationFrame(roll);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", stop);

    return () => {
      dead = true;
      unwarm();
      stop();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", stop);
      cleanup();
    };
  }, []);

  return (
    // GSAP wraps the pinned section in a spacer; this outer div is what React removes on unmount.
    <div>
      <section ref={pin} aria-label="Flip over the barricade" className="group relative h-[100dvh] overflow-hidden bg-cream">
        <div
          ref={host}
          role="img"
          aria-label="A runner flip-jumps over a Delhi Police barricade on a city road"
          className="absolute inset-0"
        />
        {/* The driver's question, pinned above his head by the frame loop (--x, --y); kept clear of the screen top. */}
        <div
          ref={bubble}
          aria-hidden="true"
          className="pointer-events-none absolute left-[var(--x,50%)] top-[max(var(--y,40%),6.5rem)] z-[2] origin-bottom-left -translate-x-6 -translate-y-[calc(100%_+_1.25rem)] scale-0 opacity-0 transition-[scale,opacity] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-data-[ask]:scale-100 group-data-[ask]:opacity-100"
        >
          <p className="relative whitespace-nowrap border-4 border-ink bg-cream px-4 py-2 font-display text-lg shadow-[5px_5px_0_var(--color-ink)] sm:text-2xl">
            Bhaiya! Where to go?
            {/* tail, pointing down at his head */}
            <span className="absolute -bottom-[14px] left-4 size-5 rotate-45 border-b-4 border-r-4 border-ink bg-cream" />
          </p>
        </div>
        {/* Destinations: the nav links as signboards, coming up one after another. */}
        <nav aria-label="Main" className="absolute inset-x-3 bottom-14 z-[2] sm:bottom-16">
          <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {navLinks.map((l, i) => (
              <li
                key={l.href}
                style={{ transitionDelay: `${i * 70}ms` }}
                className="invisible translate-y-6 opacity-0 transition-all duration-300 group-data-[go]:visible group-data-[go]:translate-y-0 group-data-[go]:opacity-100"
              >
                <TLink
                  href={l.href}
                  prefetch={false} // laid out (hidden) from the start: the warm-up fetches their pages once home has loaded
                  onClick={(e) => {
                    // a plain click rides there; modifier clicks (new tab etc.) and no scene fall through to the link
                    if (!ride.current || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    ride.current(l.href);
                  }}
                  className="flex min-h-12 flex-col items-center border-4 border-ink bg-marigold px-4 py-1.5 shadow-[4px_4px_0_var(--color-ink)] transition-[translate,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none sm:px-6"
                >
                  <span className="font-display text-base sm:text-xl">{l.label}</span>
                  <span className="font-deva text-sm text-rani-deep" aria-hidden="true">
                    {l.hindi}
                  </span>
                </TLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* Scroll hint: up from the first paint (before the scene loads), gone once scrolling starts. */}
        <p
          aria-hidden="true"
          className="pointer-events-none absolute bottom-16 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-2 border-4 border-ink bg-ink px-4 py-2 font-mono text-sm font-bold tracking-widest text-turmeric shadow-[4px_4px_0_var(--color-marigold)] transition-opacity duration-300 group-data-[moved]:opacity-0"
        >
          SCROLL
          <ArrowDown size={18} weight="bold" className="motion-safe:animate-bounce" />
        </p>
        {/* Skip: walks, jumps and boards for you, up to the driver's question; gone once he has asked. */}
        <button
          type="button"
          onClick={() => skip.current?.()}
          className="absolute bottom-3 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-2 border-4 border-ink bg-marigold px-4 py-1.5 font-mono text-sm font-bold tracking-widest text-ink shadow-[4px_4px_0_var(--color-ink)] transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-ink)] active:translate-y-1 active:shadow-none motion-reduce:hidden group-data-[asked]:hidden"
        >
          SKIP SCROLLING
          <FastForward size={18} weight="fill" aria-hidden="true" />
        </button>
        {/* CC BY 4.0 requires credit: the full list lives on the About page, linked from here.
        <TLink href="/about#credits" className="absolute bottom-2 right-3 z-[1] font-mono text-[10px] text-cream/70 underline hover:text-cream">
          3D credits
        </TLink> */}
      </section>
    </div>
  );
}
