"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei/web/Html";
import { useGLTF } from "@react-three/drei/core/Gltf";
import { ACESFilmicToneMapping, BackSide, CanvasTexture, Color, Fog, Mesh, MeshBasicMaterial, Quaternion, SRGBColorSpace, TextureLoader, Vector2, Vector3, type Group, type MeshStandardMaterial, type Object3D } from "three";
import { drawSky, lahoreHour } from "./sky";
import { spots, views, type DeskData, type DeskNote, type DeskProject, type Spot, type Target } from "./data";
import bake from "./room.json";

export type Theme = "dark" | "light";
export type Terminal = { lines: string[]; input: string };
export type SceneProps = {
  data: DeskData;
  theme: Theme;
  quality: "normal" | "low";
  open: Spot | null;
  hover: Target | null;
  pulse: Spot | null;
  workIndex: number;
  note: string | null;
  terminal: Terminal | null;
  reducedMotion: boolean;
  skipIntro: boolean;
  onReady: () => void;
  onIntroDone: () => void;
  onHover: Dispatch<SetStateAction<Target | null>>;
  onSelect: (target: Target, note?: string) => void;
};

const ROOM = "/models/desk/room.glb";
const LIGHTMAPS = ["/models/desk/light-dark.webp", "/models/desk/light-light.webp"];
// Close-ups at night open up the exposure, like eyes adjusting, so dim corners stay readable.
const theme = { dark: { bg: "#0e0d0c", accent: "#e0763a", exposure: 2.2, closeUp: 2.6, sky: 0.6 }, light: { bg: "#f4f2ee", accent: "#b4441b", exposure: 1.15, closeUp: 1.25, sky: 1 } };
// Faces that glow on their own (screens, the sky, the bulb) skip the baked light.
const UNLIT = new Set(["screen", "phone-screen", "sky", "lamp-bulb", "shelf-strip"]);
// Flat faces that show live content; they sit on a body that already gets the outline.
const CONTENT = /^(paper-top|paper-bottom|card-\d|screen|badge-\d|photo|phone-screen|calendar)$/;
const CARD_SLOTS = 6;
const BADGE_SLOTS = 5;
const RIM = 0.006;

// --- Canvas textures ---------------------------------------------------------------------

const fonts = () => {
  const style = getComputedStyle(document.body);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return { serif: read("--font-instrument", "Georgia, serif"), sans: read("--font-geist-sans", "system-ui, sans-serif"), mono: read("--font-geist-mono", "ui-monospace, monospace") };
};
type Fonts = ReturnType<typeof fonts>;

function wrap(g: CanvasRenderingContext2D, text: string, max: number, lines = 9) {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > max && line) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  if (out.length > lines) { out.length = lines; out[lines - 1] = `${out[lines - 1].replace(/\s+\S*$/, "")}…`; }
  return out;
}

type Draw = (g: CanvasRenderingContext2D, w: number, h: number, f: Fonts) => void;

// Paints a named face of the model with a canvas that redraws whenever `version` changes.
function Paint({ on, w, h, draw, version }: { on: (Mesh | undefined)[]; w: number; h: number; draw: Draw; version: string }) {
  const invalidate = useThree((state) => state.invalidate);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.flipY = false; // glTF UVs
    t.anisotropy = 8;
    return t;
  }, [w, h]);
  const latest = useRef(draw);
  latest.current = draw;
  useEffect(() => {
    latest.current((texture.image as HTMLCanvasElement).getContext("2d")!, w, h, fonts());
    texture.needsUpdate = true;
    invalidate();
  }, [texture, version, w, h, invalidate]);
  const meshes = on.filter((mesh): mesh is Mesh => !!mesh);
  const key = meshes.map((mesh) => mesh.uuid).join();
  useEffect(() => {
    for (const mesh of meshes) {
      const material = mesh.material as MeshBasicMaterial;
      material.map = texture;
      material.color.set("#ffffff");
      material.needsUpdate = true;
    }
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for the mesh list
  }, [key, texture, invalidate]);
  useEffect(() => () => texture.dispose(), [texture]);
  return null;
}

const lahoreClock = () => new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" }).format(new Date());
const lahoreDate = () => new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()).toUpperCase();

// Ticks once a minute so the sky, phone and newspaper date stay current.
function useMinute() {
  const [minute, setMinute] = useState(() => Math.floor(Date.now() / 60_000));
  useEffect(() => {
    const timer = window.setInterval(() => setMinute(Math.floor(Date.now() / 60_000)), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return minute;
}

// The whole front page; folded, only the top half (masthead and headline) shows.
const drawPaper = (posts: DeskData["posts"]): Draw => (g, w, h, f) => {
  const [post, next] = posts;
  g.fillStyle = "#ebe4d6"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#141414"; g.textAlign = "center";
  g.font = `46px ${f.serif}`; g.fillText("The Desk Daily", w / 2, 54);
  g.fillRect(20, 66, w - 40, 2);
  g.font = `500 10px ${f.mono}`; g.fillText(`LAHORE · ${lahoreDate()}`, w / 2, 84);
  g.fillRect(20, 92, w - 40, 1);
  g.textAlign = "left";
  g.font = `32px ${f.serif}`;
  const head = wrap(g, post?.title ?? "Nothing printed yet", w - 40, 3);
  head.forEach((line, i) => g.fillText(line, 20, 132 + i * 34));
  let y = 132 + head.length * 34;
  g.fillStyle = "#4a4540"; g.font = `14px ${f.sans}`;
  for (const line of wrap(g, post?.summary ?? "", w - 40, 3)) { g.fillText(line, 20, y); y += 19; }
  g.fillStyle = "#b8b0a2";
  for (let col = 0; col < 3; col++) for (let row = 0; y + 12 + row * 12 < h / 2 - 10; row++) g.fillRect(20 + col * 162, y + 12 + row * 12, 150 - (row % 4 === 3 ? 40 : 0), 5);
  // Below the fold
  y = h / 2 + 34;
  g.fillStyle = "#141414"; g.fillRect(20, h / 2 + 12, w - 40, 1);
  if (next) {
    g.font = `500 10px ${f.mono}`; g.fillText("ALSO IN THIS ISSUE", 20, y);
    g.font = `26px ${f.serif}`;
    for (const line of wrap(g, next.title, w - 40, 2)) { y += 30; g.fillText(line, 20, y); }
    y += 10;
  }
  g.fillStyle = "#b8b0a2";
  for (let col = 0; col < 3; col++) for (let row = 0; y + 12 + row * 12 < h - 16; row++) g.fillRect(20 + col * 162, y + 12 + row * 12, 150 - (row % 5 === 4 ? 50 : 0), 5);
};

const drawCard = (note: DeskNote): Draw => (g, w, h, f) => {
  g.fillStyle = "#f3eee4"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#c8602f"; g.fillRect(0, 24, w, 2);
  g.fillStyle = "#2a1d0c"; g.font = `24px ${f.serif}`;
  wrap(g, note.title, w - 24, 4).forEach((line, i) => g.fillText(line, 12, 56 + i * 26));
};

const drawTerminal = (terminal: Terminal): Draw => (g, w, h, f) => {
  g.fillStyle = "#0c0b0a"; g.fillRect(0, 0, w, h);
  g.font = `15px ${f.mono}`;
  const rows = [...terminal.lines, `ali@desk ~ % ${terminal.input}`].slice(-17);
  rows.forEach((row, i) => {
    const prompt = row.startsWith("ali@desk");
    g.fillStyle = prompt ? "#e0763a" : "#d9d2c6";
    g.fillText(prompt ? "ali@desk" : row, 24, 36 + i * 21);
    if (prompt) { g.fillStyle = "#9a9286"; g.fillText(` ~ % ${row.slice(13)}`, 24 + g.measureText("ali@desk").width, 36 + i * 21); }
  });
  const last = `ali@desk ~ % ${terminal.input}`;
  g.fillStyle = "#ece6dc"; g.fillRect(24 + g.measureText(last).width + 2, 36 + (rows.length - 1) * 21 - 13, 9, 16);
};

const drawScreen = (project: DeskProject | undefined, index: number, total: number, image: HTMLImageElement | null): Draw => (g, w, h, f) => {
  g.fillStyle = "#121110"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#e0763a"; g.font = `500 13px ${f.mono}`;
  g.fillText(`WORK · ${index + 1} / ${total}`, 28, 40);
  g.fillStyle = "#ece6dc"; g.font = `38px ${f.serif}`;
  g.fillText(wrap(g, project?.title ?? "", w - 56, 1)[0] ?? "", 28, 84);
  g.fillStyle = "#9a9286"; g.font = `14px ${f.sans}`;
  wrap(g, project?.description ?? "", w - 56, 2).forEach((line, i) => g.fillText(line, 28, 112 + i * 19));
  const box = { x: 28, y: 158, w: w - 56, h: h - 186 };
  g.fillStyle = "#1c1a17"; g.fillRect(box.x, box.y, box.w, box.h);
  if (image) {
    const scale = Math.max(box.w / image.width, box.h / image.height);
    const sw = box.w / scale, sh = box.h / scale;
    g.drawImage(image, (image.width - sw) / 2, 0, sw, sh, box.x, box.y, box.w, box.h);
    return;
  }
  // No screenshot yet: list what it does.
  g.font = `15px ${f.sans}`;
  let y = box.y + 34;
  for (const feature of project?.features ?? []) {
    const lines = wrap(g, feature, box.w - 56, 2);
    if (y + lines.length * 20 > box.y + box.h - 10) break;
    g.fillStyle = "#e0763a"; g.fillRect(box.x + 22, y - 6, 6, 6);
    g.fillStyle = "#d9cfc1";
    lines.forEach((line, n) => g.fillText(line, box.x + 40, y + n * 20));
    y += lines.length * 20 + 14;
  }
};

const badgeColors = ["#c8602f", "#3a342c", "#6e4a30", "#8a4421"];
const drawBadge = (job: DeskData["jobs"][number], color: string): Draw => (g, w, h, f) => {
  g.fillStyle = "#f3eee4"; g.fillRect(0, 0, w, h);
  g.fillStyle = color; g.fillRect(0, 0, w, 40);
  g.fillStyle = "#fff"; g.font = `500 12px ${f.mono}`; g.fillText(job.company.toUpperCase().slice(0, 13), 10, 26);
  g.fillStyle = "#b8b0a2"; g.fillRect(36, 54, 48, 48);
  g.fillStyle = "#2a1d0c"; g.font = `13px ${f.sans}`;
  wrap(g, job.role, w - 20, 2).forEach((line, n) => g.fillText(line, 10, 124 + n * 16));
};

// Placeholder until Ali's photo is in.
const drawPhoto: Draw = (g, w, h, f) => {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#6e4a30"); grad.addColorStop(1, "#1c1a17");
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  g.fillStyle = "#ece6dc"; g.font = `64px ${f.serif}`; g.textAlign = "center"; g.fillText("AA", w / 2, h / 2 + 20);
};

const drawPhone: Draw = (g, w, h, f) => {
  g.fillStyle = "#121110"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#ece6dc"; g.textAlign = "center";
  g.font = `30px ${f.serif}`; g.fillText(lahoreClock(), w / 2, 70);
  g.fillStyle = "#9a9286"; g.font = `500 9px ${f.mono}`; g.fillText("LAHORE", w / 2, 88);
  g.fillStyle = "#e0763a"; g.font = `20px ${f.serif}`; g.fillText("Say hi", w / 2, 190);
};

const heat = ["#e0dbd2", "#f2c9ad", "#e3946a", "#c8602f", "#9a3a12"];
const level = (n: number) => (n === 0 ? 0 : n < 5 ? 1 : n < 12 ? 2 : n < 19 ? 3 : 4);
const drawCalendar = (activity: DeskData["activity"]): Draw => (g, w, h, f) => {
  g.fillStyle = "#ece6dc"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#141414"; g.font = `500 11px ${f.mono}`;
  g.fillText(`${activity.total.toLocaleString("en-US")} CONTRIBUTIONS IN THE LAST YEAR`, 16, 24);
  activity.weeks.forEach((week, x) => week.forEach((count, y) => { g.fillStyle = heat[level(count)]; g.fillRect(28 + x * 19, 40 + y * 19, 18, 18); }));
};

function ScreenPaint({ mesh, data, workIndex, terminal }: { mesh: Mesh | undefined; data: DeskData; workIndex: number; terminal: Terminal | null }) {
  const project = data.projects[workIndex % Math.max(1, data.projects.length)];
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    setImage(null);
    if (!project?.image) return;
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = encodeURI(project.image);
  }, [project?.image]);
  if (terminal) return <Paint on={[mesh]} w={640} h={400} draw={drawTerminal(terminal)} version={`term-${terminal.lines.length}-${terminal.input}`} />;
  return <Paint on={[mesh]} w={640} h={400} draw={drawScreen(project, workIndex, data.projects.length, image)} version={`${workIndex}-${image?.src ?? ""}`} />;
}

function Content({ room, data, workIndex, terminal }: { room: Room; data: DeskData; workIndex: number; terminal: Terminal | null }) {
  const minute = useMinute();
  const day = Math.floor(minute / 1440);
  const m = (name: string) => room.meshes.get(name);
  return (
    <>
      <Paint on={[m("sky")]} w={400} h={300} draw={(g, w, h) => drawSky(g, w, h, lahoreHour())} version={String(minute)} />
      <Paint on={[m("paper-top"), m("paper-bottom")]} w={512} h={720} draw={drawPaper(data.posts)} version={`${data.posts.map((post) => post.slug).join()}-${day}`} />
      {data.notes.slice(0, CARD_SLOTS).map((note, i) => <Paint key={note.slug} on={[m(`card-${i}`)]} w={220} h={156} draw={drawCard(note)} version={note.slug} />)}
      <ScreenPaint mesh={m("screen")} data={data} workIndex={workIndex} terminal={terminal} />
      {data.jobs.slice(0, BADGE_SLOTS).map((job, i) => <Paint key={job.company} on={[m(`badge-${i}`)]} w={120} h={168} draw={drawBadge(job, badgeColors[i])} version={job.company} />)}
      <Paint on={[m("photo")]} w={160} h={200} draw={drawPhoto} version="placeholder" />
      <Paint on={[m("phone-screen")]} w={120} h={240} draw={drawPhone} version={String(minute)} />
      <Paint on={[m("calendar")]} w={330} h={190} draw={drawCalendar(data.activity)} version={`${data.activity.total}-${data.activity.lastActive}`} />
    </>
  );
}

// --- The baked room ----------------------------------------------------------------------

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

type Part = { node: Object3D; rims: Mesh[] };
type Room = ReturnType<typeof useRoom>;
const targets: Target[] = [...spots.map((spot) => spot.id), "lamp"];

// Hover outline: an inside-out copy of the mesh, grown a few millimetres around its centre.
function rim(mesh: Mesh, material: MeshBasicMaterial) {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox!;
  const size = box.getSize(new Vector3()), center = box.getCenter(new Vector3());
  const grow = (s: number) => (s > 1e-4 ? (s + RIM * 2) / s : 1);
  const copy = new Mesh(mesh.geometry, material);
  copy.scale.set(grow(size.x), grow(size.y), grow(size.z));
  copy.position.set(center.x * (1 - copy.scale.x), center.y * (1 - copy.scale.y), center.z * (1 - copy.scale.z));
  copy.raycast = () => {};
  copy.visible = false;
  mesh.add(copy);
  return copy;
}

function useRoom(data: DeskData) {
  const gltf = useGLTF(ROOM);
  const lightmaps = useLoader(TextureLoader, LIGHTMAPS);
  return useMemo(() => {
    for (const map of lightmaps) { map.flipY = false; map.channel = 1; map.colorSpace = SRGBColorSpace; }
    const root = gltf.scene.clone(true);
    const meshes = new Map<string, Mesh>();
    const baked: MeshBasicMaterial[] = [];
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      meshes.set(object.name, object);
      const source = object.material as MeshStandardMaterial;
      const glow = UNLIT.has(object.name);
      // Store-bought models keep their colour texture; it sits on the first UV set, the lightmap on the second.
      const material = new MeshBasicMaterial({ color: object.name === "lamp-bulb" || object.name === "shelf-strip" ? new Color("#ffe2b8") : source.color.clone(), map: glow ? null : source.map, lightMap: glow ? null : lightmaps[0] });
      if (!glow) baked.push(material);
      object.material = material;
    });
    // Only as many cards and badges as there are notes and jobs; badges re-centre on the hook.
    // The page moves these; each remembers where the model put it.
    const pivot = (name: string) => {
      const object = root.getObjectByName(name)!;
      object.userData.base = { position: object.position.clone(), quaternion: object.quaternion.clone() };
      return object;
    };
    const cards = Array.from({ length: CARD_SLOTS }, (_, i) => pivot(`cardslot-${i}`));
    const badges = Array.from({ length: BADGE_SLOTS }, (_, i) => pivot(`badgeslot-${i}`));
    const news = pivot("news"), fold = pivot("paper-fold");
    // Only as many cards and badges as there are notes and jobs; badges re-centre on the hook.
    cards.forEach((card, i) => { card.visible = i < data.notes.length; const pinMesh = meshes.get(`pin-${i}`); if (pinMesh) pinMesh.visible = card.visible; });
    const sky = meshes.get("sky");
    if (sky) (sky.material as MeshBasicMaterial).toneMapped = false; // keep the real sky colour at any exposure
    const jobs = Math.min(data.jobs.length, BADGE_SLOTS);
    badges.forEach((badge, i) => { badge.visible = i < jobs; badge.userData.base.position.x += (BADGE_SLOTS - jobs) * 0.04; badge.position.copy(badge.userData.base.position); });
    const rimMaterial = new MeshBasicMaterial({ side: BackSide, toneMapped: false });
    const parts = {} as Record<Target, Part>;
    for (const id of targets) {
      const node = root.getObjectByName(`hot-${id}`)!;
      const rims: Mesh[] = [];
      node.traverse((object) => { if (object instanceof Mesh && object.visible && !CONTENT.test(object.name)) rims.push(rim(object, rimMaterial)); });
      parts[id] = { node, rims };
    }
    return { root, meshes, baked, lightmaps, parts, rimMaterial, cards, badges, news, fold, jobs };
  }, [gltf, lightmaps, data.notes.length, data.jobs.length]);
}

// The lamp flickers on, then the room comes up to full.
const flicker = (t: number) => {
  const keys = [[0, 0], [0.08, 0.8], [0.16, 0.15], [0.26, 0.9], [0.36, 0.35], [0.5, 1]];
  if (t <= 0) return 0;
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i], [t0, v0] = keys[i - 1];
    if (t < t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
  }
  return 1;
};

function Light({ room, scene }: { room: Room; scene: SceneProps }) {
  const started = useRef(performance.now()), done = useRef(false);
  const switched = useRef({ theme: scene.theme, at: 0 });
  const { invalidate, gl } = useThree();
  // The light switch dips the room for a moment instead of cutting.
  useEffect(() => {
    if (switched.current.theme === scene.theme) return;
    switched.current = { theme: scene.theme, at: performance.now() };
    invalidate();
  }, [scene.theme, invalidate]);
  useEffect(() => { room.rimMaterial.color.set(theme[scene.theme].accent); invalidate(); }, [room, scene.theme, scene.open, invalidate]);
  useFrame(() => {
    const t = (performance.now() - started.current) / 1000 - 0.3;
    const instant = scene.skipIntro || scene.reducedMotion;
    const level = instant ? 1 : flicker(t) * Math.min(1, 0.45 + Math.max(0, t) / 1.3);
    const map = room.lightmaps[scene.theme === "dark" ? 0 : 1];
    // The bake stores light scaled to fit 8 bits; this undoes it (MeshBasicMaterial divides by PI).
    const dipT = (performance.now() - switched.current.at) / 320;
    const dip = scene.reducedMotion || dipT >= 1 ? 1 : 1 - 0.65 * Math.sin(Math.PI * dipT);
    if (dip < 1) invalidate();
    const intensity = (Math.PI / bake.scale[scene.theme]) * level * dip;
    const sky = room.meshes.get("sky");
    if (sky) (sky.material as MeshBasicMaterial).color.setScalar(theme[scene.theme].sky);
    for (const material of room.baked) { material.lightMap = map; material.lightMapIntensity = intensity; }
    const look = theme[scene.theme], want = scene.open ? look.closeUp : look.exposure;
    const exposure = scene.reducedMotion ? want : gl.toneMappingExposure + (want - gl.toneMappingExposure) * 0.06;
    gl.toneMappingExposure = Math.abs(want - exposure) < 0.005 ? want : exposure;
    if (gl.toneMappingExposure !== want) invalidate();
    if (done.current) return;
    if (level >= 1) { done.current = true; scene.onIntroDone(); } else invalidate();
  });
  return null;
}

const X = new Vector3(1, 0, 0), Y = new Vector3(0, 1, 0), Z = new Vector3(0, 0, 1);
const turn = new Quaternion();
function pose(object: Object3D, offset: [number, number, number], axis: Vector3, angle: number) {
  const base = object.userData.base;
  object.position.set(base.position.x + offset[0], base.position.y + offset[1], base.position.z + offset[2]);
  object.quaternion.copy(base.quaternion).multiply(turn.setFromAxisAngle(axis, angle));
}

// Stage 3: the newspaper unfolds, the picked card unpins and spins, the badges fan out.
function Motion({ room, scene }: { room: Room; scene: SceneProps }) {
  const invalidate = useThree((state) => state.invalidate);
  const picked = scene.open === "notes" && scene.note ? scene.data.notes.findIndex((note) => note.slug === scene.note) : -1;
  const s = useRef({ fold: 1, fan: 0, out: new Array(CARD_SLOTS).fill(0) as number[], spinAt: 0 });
  useEffect(() => { s.current.spinAt = performance.now(); invalidate(); }, [picked, scene.open, invalidate]);
  useFrame((_, delta) => {
    const state = s.current;
    const k = scene.reducedMotion ? 1 : Math.min(1, delta * 6);
    let moving = false;
    const step = (value: number, want: number) => { const next = value + (want - value) * k; if (Math.abs(want - next) > 0.001) moving = true; return Math.abs(want - next) > 0.001 ? next : want; };
    state.fold = step(state.fold, scene.open === "blog" ? 0 : 1);
    // Folded, the near half tucks under the far one, so the paper sits one sheet higher.
    pose(room.news, [0, 0.004 * state.fold, 0], Y, 0);
    pose(room.fold, [0, 0, 0], X, Math.PI * state.fold);
    state.fan = step(state.fan, scene.open === "experience" ? 1 : 0);
    room.badges.forEach((badge, i) => pose(badge, [0, 0, 0.02 * state.fan], Z, (i - (room.jobs - 1) / 2) * 0.22 * state.fan));
    const spin = scene.reducedMotion ? 1 : Math.min(1, (performance.now() - state.spinAt) / 650);
    if (spin < 1) moving = true;
    room.cards.forEach((card, i) => {
      state.out[i] = step(state.out[i], i === picked ? 1 : 0);
      pose(card, [0, 0, 0.06 * state.out[i]], Y, i === picked ? Math.PI * 2 * ease(spin) : 0);
    });
    if (moving) invalidate();
  });
  return null;
}

type HotProps = {
  id: Target; label: string; object: string; at: [number, number, number]; lift?: [number, number, number]; part: Part; scene: SceneProps;
  pick?: (object: Object3D) => string | undefined;
  describe?: (object: Object3D) => string | undefined; // a more specific label for the part under the pointer
};

// A clickable object: lifts a little and gets an outline and its name on hover.
function Hot({ id, label, object, at, lift = [0, 0.015, 0], part, scene, pick, describe }: HotProps) {
  const [detail, setDetail] = useState<string>();
  const group = useRef<Group>(null);
  const amount = useRef(0);
  const invalidate = useThree((state) => state.invalidate);
  const opened = scene.open === id;
  const hot = (scene.hover === id || scene.pulse === id) && !opened;
  useEffect(() => { for (const r of part.rims) r.visible = hot; invalidate(); }, [hot, part, invalidate]);
  useFrame((_, delta) => {
    const want = hot ? 1 : 0;
    if (!group.current || Math.abs(want - amount.current) < 0.001) return;
    amount.current += (want - amount.current) * Math.min(1, delta * 14);
    group.current.position.set(lift[0] * amount.current, lift[1] * amount.current, lift[2] * amount.current);
    invalidate();
  });
  return (
    <group
      ref={group}
      onPointerOver={(event) => { event.stopPropagation(); scene.onHover(id); setDetail(describe?.(event.object)); }}
      onPointerOut={(event) => { event.stopPropagation(); scene.onHover((current) => (current === id ? null : current)); }}
      onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); scene.onSelect(id, pick?.(event.object)); }}
    >
      <primitive object={part.node} />
      {scene.hover === id && !opened && (
        <Html position={at} center zIndexRange={[30, 20]} style={{ pointerEvents: "none" }}>
          <span className="dk-tag"><b>{label}</b> · {scene.hover === id && detail ? detail : object}</span>
        </Html>
      )}
    </group>
  );
}

function Model(scene: SceneProps) {
  const room = useRoom(scene.data);
  const { onReady } = scene;
  useEffect(() => { onReady(); }, [onReady]);
  const slot = (pattern: RegExp, object: Object3D) => { const match = pattern.exec(object.name); return match ? Number(match[1]) : -1; };
  const pickNote = (object: Object3D) => scene.data.notes[slot(/^(?:card|cardbody|pin)-(\d)/, object)]?.slug;
  const noteTitle = (object: Object3D) => scene.data.notes[slot(/^(?:card|cardbody|pin)-(\d)/, object)]?.title;
  const company = (object: Object3D) => scene.data.jobs[slot(/^(?:lanyard|badgebody|badge)-(\d)/, object)]?.company;
  const p = room.parts;
  return (
    <>
      <primitive object={room.root} />
      <Light room={room} scene={scene} />
      <Motion room={room} scene={scene} />
      <Content room={room} data={scene.data} workIndex={scene.workIndex} terminal={scene.terminal} />
      <Hot id="blog" label="Blog" object="Newspaper" at={[-0.5, 0.86, 0.16]} lift={[0, 0.025, 0]} part={p.blog} scene={scene} />
      <Hot id="notes" label="Field notes" object="Corkboard" at={[-0.8, 1.76, -0.78]} lift={[0, 0, 0.01]} part={p.notes} scene={scene} pick={pickNote} describe={noteTitle} />
      <Hot id="work" label="Work" object="Computer" at={[-0.05, 1.38, -0.17]} lift={[0, 0.006, 0]} part={p.work} scene={scene} />
      <Hot id="experience" label="Experience" object="Badges" at={[0.72, 1.28, -0.78]} lift={[0, 0, 0.01]} part={p.experience} scene={scene} describe={company} />
      <Hot id="about" label="About" object="Photo" at={[0.28, 0.97, -0.22]} lift={[0, 0.01, 0]} part={p.about} scene={scene} />
      <Hot id="contact" label="Contact" object="Phone" at={[0.42, 0.82, 0.22]} lift={[0, 0.02, 0]} part={p.contact} scene={scene} />
      <Hot id="activity" label="Activity" object="Calendar" at={[0.3, 1.73, -0.79]} lift={[0, 0, 0.01]} part={p.activity} scene={scene} />
      <Hot id="lamp" label="Room lights" object={scene.theme === "dark" ? "Turn on" : "Turn off"} at={[-0.4, 1.36, -0.08]} lift={[0, 0.005, 0]} part={p.lamp} scene={scene} />
    </>
  );
}

// --- Camera ------------------------------------------------------------------------------

// Moves between the room view and each object's close-up; in the room view the mouse leans the camera a little.
function Rig({ open, reducedMotion }: Pick<SceneProps, "open" | "reducedMotion">) {
  const { camera, invalidate, gl, pointer } = useThree();
  const look = useRef(new Vector3(...views.room.target));
  const from = useRef({ pos: camera.position.clone(), look: look.current.clone(), at: 0 });
  const lean = useRef(new Vector2());
  const pos = useMemo(() => new Vector3(), []), target = useMemo(() => new Vector3(), []);
  useEffect(() => {
    from.current = { pos: camera.position.clone(), look: look.current.clone(), at: performance.now() };
    invalidate();
  }, [open, camera, invalidate]);
  useEffect(() => {
    const move = () => invalidate();
    gl.domElement.addEventListener("pointermove", move);
    return () => gl.domElement.removeEventListener("pointermove", move);
  }, [gl, invalidate]);
  useFrame(() => {
    const view = views[open ?? "room"];
    const k = reducedMotion ? 1 : Math.min(1, (performance.now() - from.current.at) / 900);
    const wantX = open || reducedMotion ? 0 : pointer.x, wantY = open || reducedMotion ? 0 : pointer.y;
    lean.current.x += (wantX - lean.current.x) * 0.08;
    lean.current.y += (wantY - lean.current.y) * 0.08;
    pos.set(view.pos[0] + lean.current.x * 0.12, view.pos[1] + lean.current.y * 0.05, view.pos[2]);
    target.set(...view.target);
    camera.position.lerpVectors(from.current.pos, pos, ease(k));
    look.current.lerpVectors(from.current.look, target, ease(k));
    camera.lookAt(look.current);
    if (k < 1 || Math.abs(wantX - lean.current.x) > 0.001 || Math.abs(wantY - lean.current.y) > 0.001) invalidate();
  });
  return null;
}

function Backdrop({ name }: { name: Theme }) {
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    scene.background = new Color(theme[name].bg);
    scene.fog = new Fog(theme[name].bg, 4, 9);
  }, [scene, name]);
  return null;
}

export default function Scene(props: SceneProps) {
  return (
    <Canvas
      className="dk-canvas"
      dpr={props.quality === "low" ? 1 : [1, 1.75]}
      frameloop="demand"
      camera={{ fov: 38, near: 0.01, far: 30, position: views.room.pos }}
      gl={{ antialias: props.quality === "normal" }}
      onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; }}
      onPointerMissed={() => props.onHover(null)}
      aria-hidden
    >
      <Backdrop name={props.theme} />
      <Rig open={props.open} reducedMotion={props.reducedMotion} />
      <Suspense fallback={null}><Model {...props} /></Suspense>
    </Canvas>
  );
}

useGLTF.preload(ROOM);
