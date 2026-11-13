"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei/web/Html";
import { useGLTF } from "@react-three/drei/core/Gltf";
import { ACESFilmicToneMapping, BackSide, Box3, BufferGeometry, CanvasTexture, Color, Fog, LinearFilter, LinearMipmapLinearFilter, MathUtils, Mesh, MeshBasicMaterial, NormalBlending, PlaneGeometry, Quaternion, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3, type Group, MeshPhysicalMaterial, MeshStandardMaterial, PMREMGenerator, RepeatWrapping, ShaderChunk, type Object3D, type WebGLProgramParametersWithUniforms } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { email } from "@/src/lib/portfolioData";
import { drawSky } from "./sky";
import { coffeeHot, screenCrops, spots, views, type DeskData, type DeskNote, type DeskProject, type Spot, type Target } from "./data";
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
// `paper` dims the painted faces: the lit bake is exposed for the walls, which would bleach white paper and its print.
const theme = { dark: { bg: new Color("#0e0d0c"), accent: "#e0763a", exposure: 2.2, sky: 0.6, paper: 1 }, light: { bg: new Color("#f4f2ee"), accent: "#b4441b", exposure: 1.15, sky: 1, paper: 1 } };
// Faces that glow on their own (screens, the sky, the bulb) skip the baked light.
const UNLIT = new Set(["screen", "phone-screen", "sky", "lamp-bulb", "shelf-strip"]);
// Flat faces that show live content; they sit on a body that already gets the outline.
const CONTENT = /^(paper-top|paper-bottom|card-\d|screen|badge-\d|now-badge|photo|phone-screen|calendar|spine-\d)$/;
const CARD_SLOTS = 6;
const SPINE_W = 34, SPINE_H = [158, 178, 198, 218, 168, 188]; // book spines, in millimetres
const BADGE_SLOTS = 5;
const RIM = 0.003;
const IDLE_VEIL = 0.32;

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

type Draw = (g: CanvasRenderingContext2D, w: number, h: number, f: Fonts, t?: number) => void;

// Paints a named face of the model with a canvas that redraws whenever `version` changes.
// `draw` works in w x h units; the canvas holds `k` pixels per unit so close-ups stay sharp.
// With `live` (seconds), it also redraws that often on rendered frames, passing the clock to `draw`.
function Paint({ on, w, h, k = 1, draw, version, live }: { on: (Mesh | undefined)[]; w: number; h: number; k?: number; draw: Draw; version: string; live?: number }) {
  const invalidate = useThree((state) => state.invalidate);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w * k; canvas.height = h * k;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.flipY = false; // glTF UVs
    t.generateMipmaps = true;
    t.minFilter = LinearMipmapLinearFilter;
    t.magFilter = LinearFilter;
    t.anisotropy = 16; // the renderer clamps this to what the GPU allows
    return t;
  }, [w, h, k]);
  const latest = useRef(draw);
  latest.current = draw;
  const redraw = (t?: number) => {
    const g = (texture.image as HTMLCanvasElement).getContext("2d")!;
    g.setTransform(k, 0, 0, k, 0, 0);
    latest.current(g, w, h, fonts(), t);
    texture.needsUpdate = true;
  };
  const drawn = useRef(0);
  useEffect(() => {
    redraw();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` stands for what `draw` shows
  }, [texture, version, w, h, k, invalidate]);
  useFrame(({ clock }) => {
    if (!live || clock.elapsedTime - drawn.current < live) return;
    drawn.current = clock.elapsedTime;
    redraw(clock.elapsedTime);
  });
  const meshes = on.filter((mesh): mesh is Mesh => !!mesh);
  const key = meshes.map((mesh) => mesh.uuid).join();
  useEffect(() => {
    for (const mesh of meshes) {
      const material = mesh.material as MeshBasicMaterial;
      material.polygonOffset = true;
      material.polygonOffsetFactor = -1;
      material.polygonOffsetUnits = -1;
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

// Ticks once a minute so the phone and newspaper date stay current.
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
  const ink = "#16130f", greek = "#655c50", half = h / 2;
  g.fillStyle = "#ece5d6"; g.fillRect(0, 0, w, h);
  // Large and dark enough to read as a front page from across the room, set in the site's serif throughout.
  g.fillStyle = ink; g.textAlign = "center";
  fit(g, "The Desk Daily", w - 48, 78, (size) => `${size}px Georgia, serif`);
  g.fillText("The Desk Daily", w / 2, 80);
  g.fillRect(24, 96, w - 48, 3); g.fillRect(24, 102, w - 48, 1);
  g.font = `600 13px ${f.mono}`; g.fillText(`LAHORE · ${lahoreDate()}`, w / 2, 123);
  g.fillRect(24, 133, w - 48, 1);
  g.textAlign = "left";
  // Use a full-width newspaper face; wrap the headline without squeezing its letters.
  g.font = `bold 42px Georgia, serif`; g.strokeStyle = ink; g.lineWidth = 0.9;
  let y = 182;
  for (const line of wrap(g, post?.title ?? "Nothing printed yet", w - 48, 3)) { g.fillText(line, 24, y); g.strokeText(line, 24, y); y += 52; }
  // Deck: the summary's first sentence.
  const summary = post?.summary ?? "";
  g.fillStyle = "#4a443c"; g.font = `italic 22px Georgia, serif`;
  y -= 16;
  for (const line of wrap(g, summary.split(/(?<=[.!?])\s/)[0], w - 48, 2)) { g.fillText(line, 24, y); y += 27; }
  g.fillStyle = ink; g.fillRect(24, y - 9, w - 48, 1);
  // Body in three columns.
  const col = (w - 48 - 24) / 3, top = y + 8;
  g.fillStyle = greek;
  for (let c = 0; c < 3; c++) for (let row = 0; top + row * 11 < half - 16; row++) g.fillRect(24 + c * (col + 12), top + row * 11, col - (row % 6 === 5 ? 34 : 0), 4);
  // Below the fold
  g.fillStyle = ink; g.fillRect(24, half + 14, w - 48, 1);
  y = half + 40;
  if (next) {
    g.font = `600 13px ${f.mono}`; g.fillText("ALSO IN THIS ISSUE", 24, y);
    g.font = `34px Georgia, serif`;
    for (const line of wrap(g, next.title, w - 48, 2)) { y += 38; g.fillText(line, 24, y); }
    y += 12;
  }
  g.fillStyle = greek;
  for (let c = 0; c < 3; c++) for (let row = 0; y + 12 + row * 11 < h - 18; row++) g.fillRect(24 + c * (col + 12), y + 12 + row * 11, col - (row % 5 === 4 ? 40 : 0), 4);
};

// The card being read gets an accent border inside its own edge, so it never covers its neighbours.
// The card being read gets an accent border inside its own edge, so it never covers its neighbours.
const drawCard = (note: DeskNote, picked: boolean): Draw => (g, w, h, f) => {
  g.fillStyle = "#f3eee4"; g.fillRect(0, 0, w, h);
  if (picked) { g.strokeStyle = "#c8602f"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); }
  g.fillStyle = "#c8602f"; g.fillRect(16, 22, 24, 2);
  g.fillStyle = "#2a1d0c";
  let size = 21;
  g.font = `500 ${size}px ${f.sans}`;
  while (wrap(g, note.title, w - 32, Infinity).length * (size + 3) > h - 70 && size > 12) {
    g.font = `500 ${--size}px ${f.sans}`;
  }
  wrap(g, note.title, w - 32, Infinity).forEach((line, i) => g.fillText(line, 16, 48 + i * (size + 3)));
  g.fillStyle = "#786c5f"; g.font = `12px ${f.mono}`;
  g.fillText(note.date, 16, h - 15);
};

// Spare cards on the board are not notes: a postcard of the view from the window, and a short to-do from real data.
const drawPostcard: Draw = (g, w, h, f) => {
  g.fillStyle = "#f3eee4"; g.fillRect(0, 0, w, h);
  g.save(); g.translate(9, 9); g.scale((w - 18) / 400, (h - 44) / 300);
  g.beginPath(); g.rect(0, 0, 400, 300); g.clip();
  drawSky(g, 400, 300, "light");
  g.restore();
  g.fillStyle = "#2a1d0c"; g.font = `italic 19px ${f.serif}`; g.fillText("Greetings from Lahore", 11, h - 13);
};

const drawTodo = (items: [string, boolean][]): Draw => (g, w, h, f) => {
  g.fillStyle = "#f6f1e6"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#c8602f"; g.font = `600 13px ${f.mono}`; g.fillText("TO DO", 13, 26);
  items.forEach(([text, done], i) => {
    const y = 60 + i * 34;
    g.strokeStyle = "#2a1d0c"; g.lineWidth = 1.5; g.strokeRect(13, y - 15, 15, 15);
    g.fillStyle = "#2a1d0c"; g.font = `21px ${f.serif}`;
    const line = wrap(g, text, w - 52, 1)[0] ?? "";
    g.fillText(line, 38, y);
    if (done) {
      g.strokeStyle = "#c8602f"; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(15, y - 8); g.lineTo(20, y - 2); g.lineTo(30, y - 18); g.stroke();
      g.strokeStyle = "rgba(42,29,12,0.6)"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(38, y - 7); g.lineTo(38 + g.measureText(line).width, y - 7); g.stroke();
    }
  });
};

const drawTerminal = (terminal: Terminal): Draw => (g, w, h, f) => {
  g.fillStyle = "#0c0b0a"; g.fillRect(0, 0, w, h);
  g.font = `15px ${f.mono}`;
  const rows = [...terminal.lines, `ali@desk ~ % ${terminal.input}`].slice(-14);
  rows.forEach((row, i) => {
    const prompt = row.startsWith("ali@desk");
    g.fillStyle = prompt ? "#e0763a" : "#d9d2c6";
    g.fillText(prompt ? "ali@desk" : row, 24, 36 + i * 21);
    if (prompt) { g.fillStyle = "#9a9286"; g.fillText(` ~ % ${row.slice(13)}`, 24 + g.measureText("ali@desk").width, 36 + i * 21); }
  });
  const last = `ali@desk ~ % ${terminal.input}`;
  g.fillStyle = "#ece6dc"; g.fillRect(24 + g.measureText(last).width + 2, 36 + (rows.length - 1) * 21 - 13, 9, 16);
};

// Shrinks the font until one line of `text` fits in `max`.
function fit(g: CanvasRenderingContext2D, text: string, max: number, size: number, font: (size: number) => string) {
  do g.font = font(size); while (g.measureText(text).width > max && --size > 6);
}

// Screenshot first, on a dark ground: the crop hint picks one readable part (a single phone screen) and draws it large,
// with what the project does beside it when there is room. A strip below carries the title, big enough to read from the room.
const STRIP = 48;
const drawScreen = (project: DeskProject | undefined, image: HTMLImageElement | null): Draw => (g, w, h, f) => {
  const top = h - STRIP;
  g.fillStyle = "#121110"; g.fillRect(0, 0, w, h);
  const features = (x: number, width: number) => {
    let y = top / 2 - 24;
    for (const feature of (project?.features ?? []).slice(0, 2)) {
      const label = feature.startsWith("Dedicated customer") ? "Customer and seller experiences" : feature.split(/,| and | with /)[0].trim();
      fit(g, label, width - 18, image ? 24 : 17, (size) => `${size}px ${f.sans}`);
      g.fillStyle = "#e0763a"; g.fillRect(x, y - 8, 6, 6);
      g.fillStyle = "#ece6dc";
      g.fillText(label, x + 18, y);
      y += 48;
    }
  };
  g.textAlign = "left";
  if (image) {
    const [cx, cy, cw, ch] = (project && screenCrops[project.title]) ?? [0, 0, 1, 1];
    const sw = image.width * cw, sh = image.height * ch, portrait = sw / sh < 0.7, scale = portrait ? Math.min((w * 0.57) / sw, top / sh) : (project?.title === "Safe Buy Africa" || project?.title === "Healing Hands CPR") ? Math.max(w / sw, top / sh) : Math.min((w - 24) / sw, (top - 12) / sh);
    const dw = sw * scale, dh = sh * scale, beside = portrait;
    const dx = beside ? 24 : (w - dw) / 2;
    g.save(); g.beginPath(); g.rect(0, 0, w, top); g.clip();
    g.drawImage(image, image.width * cx, image.height * cy, sw, sh, dx, portrait ? 0 : (top - dh) / 2, dw, dh);
    g.restore();
    if (beside) features(dw + 64, w - dw - 88);
  } else {
    const gradient = g.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#302820"); gradient.addColorStop(1, "#151412");
    g.fillStyle = gradient; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffffff09";
    for (let x = 16; x < w; x += 18) for (let y = 16; y < h; y += 18) g.fillRect(x, y, 1, 1);
    const title = project?.title ?? "Selected work";
    g.fillStyle = "#f1e7d8"; g.font = `32px ${f.serif}`;
    const lines = wrap(g, title, w * 0.64, 2);
    lines.forEach((line, i) => g.fillText(line, 28, 54 + i * 35));
    let y = 72 + (lines.length - 1) * 35;
    g.font = `12px ${f.sans}`; g.fillStyle = "#c8b9a5";
    wrap(g, project?.description ?? "", w * 0.63, 1).forEach(line => g.fillText(line, 28, y));
    y += 34; g.font = `14px ${f.sans}`;
    for (const feature of (project?.features ?? []).slice(0, 3)) {
      g.fillStyle = "#e0763a"; g.fillRect(28, y - 7, 4, 4);
      g.fillStyle = "#e7dccd";
      g.fillText(wrap(g, feature, w * 0.59, 1)[0] ?? "", 42, y); y += 25;
    }
    let x = 28; g.font = `11px ${f.sans}`;
    for (const tech of (project?.techStack ?? []).slice(0, 5)) {
      const width = g.measureText(tech).width + 18;
      if (x + width > w - 28) break;
      g.fillStyle = "#ffffff0d"; g.strokeStyle = "#a6907044";
      g.beginPath(); g.roundRect(x, h - 43, width, 23, 7); g.fill(); g.stroke();
      g.fillStyle = "#d1c3b0"; g.fillText(tech, x + 9, h - 27); x += width + 7;
    }
    g.strokeStyle = "#a6907055"; g.fillStyle = "#b18b6420";
    g.beginPath(); g.roundRect(w * .73, 73, w * .23, 137, 7); g.fill(); g.stroke();
    g.fillStyle = "#bda58855";
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w * .75 + i * 9, 85, 2, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 3; i++) g.fillRect(w * .75, 105 + i * 30, w * .18, i === 0 ? 18 : 10);
    g.fillStyle = "#e0763a"; g.fillRect(28, h - 61, w - 56, 2);
    return;
  }
  g.fillStyle = "#e0763a"; g.fillRect(0, top, w, 2);
  g.fillStyle = "#ece6dc";
  fit(g, project?.title ?? "", w - 48, 23, (size) => `${size}px ${f.sans}`);
  g.fillText(project?.title ?? "", 24, top + 33);
};

// White text reads on every one of these.
const badgeColors = ["#3a342c", "#8a4421", "#4f5a3a", "#6e4a30", "#2f4a45"];
const initials = (company: string) => company.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
// An employee badge: company on the header, its initials, the role, and one line of dates.
const drawBadge = (job: DeskData["jobs"][number], color: string, dates: string): Draw => (g, w, h, f) => {
  g.fillStyle = "#f3eee4"; g.fillRect(0, 0, w, h);
  g.fillStyle = color; g.fillRect(0, 0, w, 44);
  g.fillStyle = "#f3eee4"; g.beginPath(); g.roundRect(w / 2 - 13, 7, 26, 5, 2.5); g.fill(); // lanyard slot
  g.textAlign = "center"; g.fillStyle = "#fff";
  fit(g, job.company.toUpperCase(), w - 16, 13, (size) => `500 ${size}px ${f.mono}`);
  g.fillText(job.company.toUpperCase(), w / 2, 39);
  g.fillStyle = color; g.beginPath(); g.arc(w / 2, 73, 20, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#f3eee4"; g.font = `24px ${f.serif}`; g.fillText(initials(job.company), w / 2, 81);
  g.fillStyle = "#2a1d0c"; g.font = `500 13px ${f.sans}`;
  wrap(g, job.company === "Upwork" ? "Freelancer" : job.role, w - 14, 2).forEach((line, n) => g.fillText(line, w / 2, 107 + n * 14));
  g.fillStyle = "#40372c";
  g.font = `500 11px ${f.mono}`;
  const dateLines = dates.toUpperCase().split(" — ");
  dateLines.forEach((line, i) => g.fillText(line, w / 2, h - 10 - (dateLines.length - 1 - i) * 17));
};

// A book spine titled after his own work, read top to bottom like an English spine.
const spineColors: [string, string][] = [["#6e2a16", "#f0e4cf"], ["#1d1b19", "#e8dcc4"], ["#e9e1d0", "#2a1d0c"], ["#b4441b", "#f6ead6"], ["#232120", "#e0763a"], ["#3c4a3f", "#efe6d2"]];
// Canvas units match the face in millimetres; rotate the title without reflecting its letters.
const drawSpine = (title: string, [paper, ink]: [string, string]): Draw => (g, w, h, f) => {
  g.fillStyle = paper; g.fillRect(0, 0, w, h);
  g.save();
  g.fillStyle = ink; g.fillRect(0, 10, w, 1.5); g.fillRect(0, h - 12, w, 1.5);
  g.translate(w / 2, 22); g.rotate(Math.PI / 2);
  fit(g, title, h - 56, w * 0.62, (size) => `${size}px ${f.sans}`);
  g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(title, 0, 0); g.textBaseline = "alphabetic";
  g.restore();
};

// A framed monogram print; no personal photograph is used.
const drawPhoto: Draw = (g, w, h, f) => {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#b98a5e"); grad.addColorStop(1, "#4a3526");
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#ece6dc"; g.lineWidth = 1; g.strokeRect(12, 16, w - 24, h - 32);
  g.fillStyle = "#ece6dc"; g.font = `64px ${f.serif}`; g.textAlign = "center"; g.fillText("AA", w / 2, h / 2 + 20);
};

const drawPhone: Draw = (g, w, h, f) => {
  g.fillStyle = "#121110"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#ece6dc"; g.textAlign = "center";
  g.font = `300 23px ${f.sans}`; g.fillText(lahoreClock(), w / 2, 52);
  g.fillStyle = "#e0763a"; g.font = `500 25px ${f.sans}`; g.fillText("Say hi", w / 2, 122);
  g.fillStyle = "#ece6dc";
  fit(g, email, w - 10, 10, (size) => `400 ${size}px ${f.sans}`);
  g.fillText(email, w / 2, 156);
};

const heat = ["#e0dbd2", "#f2c9ad", "#e3946a", "#c8602f", "#9a3a12"];
const level = (n: number) => (n === 0 ? 0 : n < 5 ? 1 : n < 12 ? 2 : n < 19 ? 3 : 4);
const drawCalendar = (activity: DeskData["activity"]): Draw => (g, w, h, f) => {
  g.fillStyle = "#ece6dc"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#141414"; g.font = `500 11px ${f.mono}`;
  // The grid is the recent weeks; the yearly total sits beside it, labelled as such.
  g.fillText(`LAST ${activity.weeks.length} WEEKS`, 16, 24);
  g.textAlign = "right"; g.fillStyle = "#6b6257";
  g.fillText(`${activity.total.toLocaleString("en-US")} IN THE PAST YEAR`, w - 16, 24);
  g.textAlign = "left";
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
  if (terminal) return <Paint on={[mesh]} w={640} h={327} k={5} draw={drawTerminal(terminal)} version={`term-${terminal.lines.length}-${terminal.input}`} />;
  return <Paint on={[mesh]} w={640} h={327} k={5} draw={drawScreen(project, image)} version={`${workIndex}-${image?.src ?? ""}`} />;
}

function Content({ room, data, workIndex, terminal, minute, city, skyTheme, reading }: { room: Room; data: DeskData; workIndex: number; terminal: Terminal | null; minute: number; city: boolean; skyTheme: "light" | "dark"; reading: string | null }) {
  const day = Math.floor(minute / 1440);
  // Only his own work on the shelf: the two sections of the site and his shorter project names.
  const spines = ["Field Notes", ...data.projects.map((project) => project.title).filter((title) => title.length <= 16), "Blog"].slice(0, 6);
  const todo: [string, boolean][] = [[`Write blog post #${data.posts.length + 1}`, false], ["Push code today", coffeeHot(data.activity)], ["Pin the next fix", false]];
  const m = (name: string) => room.meshes.get(name);
  // The current job hangs on its own above the monitor; the hook keeps the rest.
  const [now, ...past] = data.jobs;
  return (
    <>
      <Paint on={[m("sky")]} w={400} h={300} k={2} draw={(g, w, h, _, t) => drawSky(g, w, h, skyTheme, t)} version={skyTheme} live={city ? 0.1 : undefined} />
      <Paint on={[m("paper-top"), m("paper-bottom")]} w={512} h={864} k={1.5} draw={drawPaper(data.posts)} version={`${data.posts.map((post) => post.slug).join()}-${day}`} />
      {data.notes.slice(0, CARD_SLOTS).map((note, i) => <Paint key={note.slug} on={[m(`card-${i}`)]} w={220} h={156} k={3} draw={drawCard(note, note.slug === reading)} version={`${note.slug}-${note.slug === reading}`} />)}
      {data.notes.length < CARD_SLOTS && <Paint on={[m(`card-${data.notes.length}`)]} w={220} h={156} k={3} draw={drawPostcard} version="postcard" />}
      {data.notes.length + 1 < CARD_SLOTS && <Paint on={[m(`card-${data.notes.length + 1}`)]} w={220} h={156} k={3} draw={drawTodo(todo)} version={todo.join()} />}
      <ScreenPaint mesh={m("screen")} data={data} workIndex={workIndex} terminal={terminal} />
      {now && <Paint on={[m("now-badge")]} w={120} h={168} k={7} draw={drawBadge(now, "#a8481d", `Since ${now.period.split(" — ")[0]}`)} version={now.company} />}
      {past.slice(0, BADGE_SLOTS).map((job, i) => <Paint key={job.company} on={[m(`badge-${i}`)]} w={120} h={168} k={4} draw={drawBadge(job, badgeColors[i % badgeColors.length], job.period)} version={job.company} />)}
      {spines.map((title, i) => <Paint key={i} on={[m(`spine-${i}`)]} w={SPINE_W} h={SPINE_H[i] ?? 180} k={6} draw={drawSpine(title, spineColors[i % spineColors.length])} version={title} />)}
      <Paint on={[m("photo")]} w={130} h={200} k={5} draw={drawPhoto} version="monogram" />
      <Paint on={[m("phone-screen")]} w={102} h={210} k={8} draw={drawPhone} version={String(minute)} />
      <Paint on={[m("calendar")]} w={330} h={190} k={5} draw={drawCalendar(data.activity)} version={`${data.activity.total}-${data.activity.lastActive}`} />
    </>
  );
}

// --- The baked room ----------------------------------------------------------------------

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

type Part = { node: Object3D; rims: Mesh[] };
type Room = ReturnType<typeof useRoom>;
const targets: Target[] = [...spots.map((spot) => spot.id), "lamp"];

// The same shape with every point pushed out along its smoothed normal.
function swell(source: BufferGeometry, by: number) {
  const geometry = mergeVertices(new BufferGeometry().setIndex(source.index).setAttribute("position", source.getAttribute("position")));
  geometry.computeVertexNormals();
  const position = geometry.getAttribute("position"), normal = geometry.getAttribute("normal");
  for (let i = 0; i < position.count; i++) position.setXYZ(i, position.getX(i) + normal.getX(i) * by, position.getY(i) + normal.getY(i) * by, position.getZ(i) + normal.getZ(i) * by);
  return geometry;
}

// Hover outline: an inside-out copy of the mesh, grown a few millimetres around its centre.
// Growing a thin, many-part shape like the lamp that way fills it in, so it swells along its surface instead.
function rim(mesh: Mesh, material: MeshBasicMaterial, thin: boolean) {
  const copy = new Mesh(thin ? swell(mesh.geometry, RIM / 2) : mesh.geometry, material);
  if (!thin) {
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox!;
    const size = box.getSize(new Vector3()), center = box.getCenter(new Vector3());
    const grow = (s: number) => (s > 1e-4 ? (s + RIM * 2) / s : 1);
    copy.scale.set(grow(size.x), grow(size.y), grow(size.z));
    copy.position.set(center.x * (1 - copy.scale.x), center.y * (1 - copy.scale.y), center.z * (1 - copy.scale.z));
  }
  copy.raycast = () => {};
  copy.visible = false;
  mesh.add(copy);
  return copy;
}

function useRoom(data: DeskData) {
  const gltf = useGLTF(ROOM);
  const gl = useThree((state) => state.gl);
  const plaster = useLoader(TextureLoader, "/models/desk/plaster.png");
  const environment = useMemo(() => {
    const generator = new PMREMGenerator(gl), room = new RoomEnvironment();
    const target = generator.fromScene(room, 0.04);
    room.dispose(); generator.dispose();
    return target;
  }, [gl]);
  useEffect(() => () => environment.dispose(), [environment]);
  const lightmaps = useLoader(TextureLoader, LIGHTMAPS);
  return useMemo(() => {
    // No mipmaps: the bake packs its islands tightly and smaller levels would bleed between them.
    for (const map of lightmaps) { map.flipY = false; map.channel = 1; map.colorSpace = SRGBColorSpace; map.generateMipmaps = false; map.minFilter = LinearFilter; map.needsUpdate = true; }
    // Both bakes stay bound, so the light switch can fade from one to the other. 0 is the night bake, 1 the lit one.
    const blend = { value: 0 };
    const veil = { value: IDLE_VEIL };
    const crossfade = (shader: WebGLProgramParametersWithUniforms) => {
      shader.uniforms.lightMapLit = { value: lightmaps[1] };
      shader.uniforms.lightBlend = blend;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <lightmap_pars_fragment>", "#include <lightmap_pars_fragment>\nuniform sampler2D lightMapLit;\nuniform float lightBlend;")
        .replace("texture2D( lightMap, vLightMapUv )", `mix( texture2D( lightMap, vLightMapUv ), texture2D( lightMapLit, vLightMapUv ) * ${(bake.scale.dark / bake.scale.light).toFixed(4)}, lightBlend )`);
    };
    const root = gltf.scene.clone(true);
    const meshes = new Map<string, Mesh>();
    const baked: (MeshBasicMaterial | MeshStandardMaterial)[] = [], paper: MeshBasicMaterial[] = [];
    plaster.wrapS = plaster.wrapT = RepeatWrapping; plaster.repeat.set(32, 32);
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      meshes.set(object.name, object);
      const source = object.material as MeshStandardMaterial;
      const glow = UNLIT.has(object.name) || object.name.startsWith("pin-");
      // Store-bought models keep their colour texture; it sits on the first UV set, the lightmap on the second.
      const polished = /^(desk-top|desk-apron|monitor-model|shelf$|window-frame|window-sill|drawer)/.test(object.name);
      const wall = object.name.startsWith("wall-");
      const material = object.name.startsWith("pin-") ? new MeshPhysicalMaterial({ color: "#d99151", roughness: .24, clearcoat: .45, envMap: environment.texture, envMapIntensity: .65 }) : polished || wall ? new MeshPhysicalMaterial({ color: wall ? new Color("#D2C2AC") : source.color.clone(), map: source.map, lightMap: lightmaps[0], roughness: wall ? .86 : .43, clearcoat: wall ? 0 : object.name.startsWith("monitor") ? .22 : .18, envMap: environment.texture, envMapIntensity: wall ? .12 : .35, bumpMap: wall ? plaster : null, bumpScale: .00035, roughnessMap: wall ? plaster : null }) : new MeshBasicMaterial({ color: object.name === "lamp-bulb" || object.name === "shelf-strip" ? new Color("#ffe2b8") : source.color.clone(), map: glow ? null : source.map, lightMap: glow ? null : lightmaps[0] });
      material.name = object.name;
      if (!glow) { material.onBeforeCompile = (shader) => {
        // Expand before the crossfade so physical materials blend both bakes too.
        if (polished || wall) shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_maps>", ShaderChunk.lights_fragment_maps.replace("iblIrradiance += getIBLIrradiance( geometryNormal );", "iblIrradiance += vec3(0.0);"));
        crossfade(shader);
      }; baked.push(material); }
      if (object.name === "screen") material.onBeforeCompile = (shader) => {
        // Idle in the room view, the screen sits back: dimmer and flatter, pulled toward black, which also flattens its contrast.
        shader.uniforms.veil = veil;
        shader.fragmentShader = shader.fragmentShader
          .replace("void main() {", "uniform float veil;\nvoid main() {")
          .replace("#include <opaque_fragment>", "outgoingLight = mix(outgoingLight, vec3(0.012), veil);\n#include <opaque_fragment>");
      };
      // Printed surfaces use the same local baked illumination as the room.
      if (!glow && CONTENT.test(object.name)) paper.push(material as MeshBasicMaterial);
      object.material = material;
    });
    // The bought grid has no sensible full US layout; keep its distinct keycaps blank.
    root.getObjectByName("key-legends")?.traverse((object) => { object.visible = false; });
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
    // Notes first, then up to two spare cards (a postcard and a to-do); each pin lives in its card's slot.
    cards.forEach((card, i) => { card.visible = i < data.notes.length + 2; });
    const sky = meshes.get("sky");
    if (sky) (sky.material as MeshBasicMaterial).toneMapped = false; // keep the real sky colour at any exposure
    const jobs = Math.min(Math.max(0, data.jobs.length - 1), BADGE_SLOTS); // the current job has its own badge
    badges.forEach((badge, i) => { badge.visible = i < jobs; badge.userData.base.position.x += (BADGE_SLOTS - jobs) * 0.04; badge.position.copy(badge.userData.base.position); });
    const rimMaterial = new MeshBasicMaterial({ side: BackSide, toneMapped: false });
    const parts = {} as Record<Target, Part>;
    for (const id of targets) {
      const node = root.getObjectByName(`hot-${id}`);
      if (!node) continue; // an older model without this object
      const rims: Mesh[] = [];
      node.traverse((object) => { if (object instanceof Mesh && object.visible && !CONTENT.test(object.name) && !/lanyard/.test(object.name)) rims.push(rim(object, rimMaterial, id === "lamp")); });
      parts[id] = { node, rims };
    }
    return { root, meshes, baked, paper, blend, veil, parts, rimMaterial, cards, badges, news, fold, jobs };
  }, [environment, plaster, gltf, lightmaps, data.notes.length, data.jobs.length]);
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
  // The intro's clock starts on the second frame: the first one compiles shaders and uploads the bakes, which stalls.
  const started = useRef<number | null>(null), frames = useRef(0), done = useRef(false);
  const lit = scene.theme === "light" ? 1 : 0;
  const fade = useRef({ from: lit, to: lit, at: 0 });
  const { invalidate, gl, scene: world } = useThree();
  // The light switch fades one bake into the other, the way room lights come up, instead of cutting.
  useEffect(() => {
    if (fade.current.to === lit) return;
    fade.current = { from: room.blend.value, to: lit, at: performance.now() };
    invalidate();
  }, [lit, room, invalidate]);
  useEffect(() => { room.rimMaterial.color.set(theme[scene.theme].accent); invalidate(); }, [room, scene.theme, scene.open, invalidate]);
  useEffect(() => { invalidate(); }, [scene.skipIntro, invalidate]); // a skip mid-intro must reach a frame
  useFrame(() => {
    if (++frames.current === 2) started.current = performance.now();
    const t = started.current === null ? -1 : (performance.now() - started.current) / 1000 - 0.3;
    const instant = scene.skipIntro || scene.reducedMotion;
    const level = instant ? 1 : 0.85 + 0.15 * flicker(t) * Math.min(1, Math.max(0, t) / 1.3);
    const { from, to, at } = fade.current;
    const k = scene.reducedMotion ? 1 : Math.min(1, (performance.now() - at) / 300);
    const mix = (room.blend.value = from + (to - from) * k * (2 - k));
    if (k < 1) invalidate();
    // The bake stores light scaled to fit 8 bits; this undoes it (MeshBasicMaterial divides by PI).
    for (const material of room.baked) material.lightMapIntensity = (Math.PI / bake.scale.dark) * level;
    for (const material of room.paper) material.color.setScalar(MathUtils.lerp(theme.dark.paper, theme.light.paper, mix));
    const sky = room.meshes.get("sky");
    if (sky) (sky.material as MeshBasicMaterial).color.setScalar(MathUtils.lerp(theme.dark.sky, theme.light.sky, mix));
    gl.toneMappingExposure = MathUtils.lerp(theme.dark.exposure, theme.light.exposure, mix);
    (world.background as Color).lerpColors(theme.dark.bg, theme.light.bg, mix);
    world.fog!.color.copy(world.background as Color);
    if (done.current) return;
    if (level >= 1) { done.current = true; scene.onIntroDone(); } else invalidate();
  });
  return null;
}

// --- Life in the room: each thing that moves reports something true ------------------------

const VERT = "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const NOISE = `float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }`;
// Soft wisps that drift and widen as they rise, gone before the top of the quad.
const STEAM = `uniform float time, opacity; uniform vec3 color; varying vec2 vUv; ${NOISE}
void main() {
  vec2 uv = vUv;
  float sway = (sin(uv.y * 3.5 - time * 0.8) * 0.09 + (noise(vec2(uv.y * 2.0 - time * 0.3, 1.0)) - 0.5) * 0.3) * uv.y;
  float x = (uv.x - 0.5 - sway) / (0.09 + 0.26 * uv.y);
  vec2 q = vec2(uv.x * 3.0 + sway * 4.0, uv.y * 2.6 - time * 0.42);
  float n = noise(q) * 0.6 + noise(q * 2.1 + 3.7) * 0.3 + noise(q * 4.3) * 0.1;
  float a = exp(-x * x * 1.6) * smoothstep(0.32, 0.8, n) * smoothstep(0.0, 0.08, uv.y) * (1.0 - smoothstep(0.35, 1.0, uv.y));
  gl_FragColor = vec4(color, a * opacity);
}`;
// Frames at about 30 fps while something in the room moves and the tab is visible; none otherwise.
function useTicker(active: boolean) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (!active) return;
    let timer = 0;
    const run = () => { window.clearInterval(timer); if (document.visibilityState === "visible") timer = window.setInterval(() => invalidate(), 33); };
    run();
    document.addEventListener("visibilitychange", run);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", run); };
  }, [active, invalidate]);
}

function Life({ room, steam }: { room: Room; steam: boolean }) {
  const things = useMemo(() => {
    room.root.updateMatrixWorld(true);
    const time = { value: 0 };
    const quad = (w: number, h: number, fragmentShader: string, uniforms: Record<string, { value: unknown }>) => {
      const mesh = new Mesh(new PlaneGeometry(w, h), new ShaderMaterial({ vertexShader: VERT, fragmentShader, uniforms: { time, ...uniforms }, transparent: true, depthWrite: false, toneMapped: false, blending: NormalBlending }));
      mesh.raycast = () => {};
      return mesh;
    };
    const mug = room.meshes.get("mug");
    let vapour: Mesh | null = null;
    if (mug) {
      const box = new Box3().setFromObject(mug), c = box.getCenter(new Vector3());
      vapour = quad(0.1, 0.2, STEAM, { opacity: { value: 0 }, color: { value: new Color(0.9, 0.85, 0.8) } });
      vapour.geometry.translate(0, 0.1, 0); // turns about the mug's rim, not the middle of the plume
      vapour.position.set(c.x, box.max.y - 0.005, c.z);
    }
    return { time, vapour };
  }, [room]);
  useEffect(() => () => { for (const mesh of [things.vapour]) if (mesh) { mesh.geometry.dispose(); (mesh.material as ShaderMaterial).dispose(); } }, [things]);
  useFrame(({ clock, camera }) => {
    const { time, vapour } = things, dark = 1 - room.blend.value;
    time.value = clock.elapsedTime;
    if (vapour) {
      vapour.visible = steam;
      vapour.quaternion.copy(camera.quaternion); // always faces the eye
      (vapour.material as ShaderMaterial).uniforms.opacity.value = MathUtils.lerp(0.42, 0.55, 1 - dark);
    }

  });
  return <>{things.vapour && <primitive object={things.vapour} />}</>;
}

const X = new Vector3(1, 0, 0), Y = new Vector3(0, 1, 0), Z = new Vector3(0, 0, 1);
const turn = new Quaternion();
function pose(object: Object3D, offset: [number, number, number], axis: Vector3, angle: number) {
  const base = object.userData.base;
  object.position.set(base.position.x + offset[0], base.position.y + offset[1], base.position.z + offset[2]);
  object.quaternion.copy(base.quaternion).multiply(turn.setFromAxisAngle(axis, angle));
}

// Stage 3: the newspaper unfolds, the picked card comes off the board to face the reader, the badges spread.
function Motion({ room, scene }: { room: Room; scene: SceneProps }) {
  const invalidate = useThree((state) => state.invalidate);
  const picked = scene.open === "notes" && scene.note ? scene.data.notes.findIndex((note) => note.slug === scene.note) : -1;
  const s = useRef({ fold: 1, fan: 0, out: new Array(CARD_SLOTS).fill(0) as number[] });
  useEffect(() => { invalidate(); }, [picked, scene.open, invalidate]);
  useFrame((_, delta) => {
    const state = s.current;
    const k = scene.reducedMotion ? 1 : Math.min(1, delta * 6);
    let moving = false;
    const step = (value: number, want: number) => { const next = value + (want - value) * k; if (Math.abs(want - next) > 0.001) moving = true; return Math.abs(want - next) > 0.001 ? next : want; };
    state.fold = step(state.fold, scene.open === "blog" ? 0 : 1);
    room.veil.value = step(room.veil.value, scene.open === "work" ? 0 : IDLE_VEIL);
    // Folded, the near half tucks under the far one, so the paper sits one sheet higher.
    pose(room.news, [0, 0.004 * state.fold, 0], Y, 0);
    pose(room.fold, [0, 0, 0], X, Math.PI * state.fold);
    state.fan = step(state.fan, scene.open === "experience" ? 1 : 0);
    room.badges.forEach((badge, i) => pose(badge, [0, 0, 0.02 * state.fan], Z, (i - (room.jobs - 1) / 2) * 0.07 * state.fan));
    // The picked card comes a quarter of the way to the reader and turns to face them: it grows without leaving its spot on screen.
    const [eyeX, , eyeZ] = views.notes.pos;
    room.cards.forEach((card, i) => {
      const out = (state.out[i] = step(state.out[i], i === picked ? 1 : 0));
      const { x, z } = card.userData.base.position;
      pose(card, [0, 0, (eyeZ - z) * 0.12 * out], Y, Math.atan2(eyeX - x, eyeZ - z) * out);
    });
    if (moving) invalidate();
  });
  return null;
}

type HotProps = {
  id: Target; label: string; object: string; at: [number, number, number]; lift?: [number, number, number]; part: Part; scene: SceneProps;
  pad?: number; // metres of unseen margin that still count as the object, for small things
  pick?: (object: Object3D) => string | undefined;
  describe?: (object: Object3D) => string | undefined; // a more specific label for the part under the pointer
};

// A clickable object: lifts a little and gets an outline and its name on hover.
function Hot({ id, label, object, at, lift = [0, 0.015, 0], part, scene, pad, pick, describe }: HotProps) {
  const [detail, setDetail] = useState<string>();
  const group = useRef<Group>(null);
  const amount = useRef(0);
  const invalidate = useThree((state) => state.invalidate);
  const opened = scene.open === id;
  const hot = (scene.hover === id || scene.pulse === id) && !opened;
  useEffect(() => { for (const r of part.rims) r.visible = hot; invalidate(); }, [hot, part, invalidate]);
  const reach = useMemo(() => {
    if (!pad) return null;
    const box = new Box3().setFromObject(part.node).expandByScalar(pad);
    return { position: box.getCenter(new Vector3()), size: box.getSize(new Vector3()).toArray() };
  }, [part, pad]);
  // The visible thing under the pointer, looking past the unseen margin.
  const under = (event: ThreeEvent<MouseEvent>) => event.intersections.find((hit) => hit.eventObject === event.eventObject && hit.object.visible)?.object ?? event.object;
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
      onPointerOver={(event) => { event.stopPropagation(); scene.onHover(id); }}
      onPointerMove={(event) => { event.stopPropagation(); setDetail(describe?.(under(event))); }}
      onPointerOut={(event) => { event.stopPropagation(); scene.onHover((current) => (current === id ? null : current)); }}
      onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); scene.onSelect(id, pick?.(under(event))); }}
    >
      <primitive object={part.node} />
      {reach && <mesh position={reach.position} visible={false}><boxGeometry args={reach.size} /></mesh>}
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
  // The camera sees nothing until every shader has compiled off the main thread, so the first frame can't freeze
  // the page (and swallow clicks) on a slow GPU. Only then is the room ready and the intro's clock allowed to start.
  const { gl, scene: world, camera, invalidate } = useThree();
  const [compiled, setCompiled] = useState(false);
  useLayoutEffect(() => {
    let live = true;
    camera.layers.disableAll();
    gl.compileAsync(world, camera).catch(() => {}).then(() => {
      if (!live) return;
      camera.layers.enable(0);
      setCompiled(true);
      invalidate();
    });
    return () => { live = false; camera.layers.enable(0); };
  }, [gl, world, camera, room, invalidate]);
  const minute = useMinute();
  // City windows flicker at night in Lahore; the mug steams when Ali pushed code today; the screen glows in the dark room.
  const calm = scene.reducedMotion;
  const city = !calm && scene.theme === "dark", steam = coffeeHot(scene.data.activity);
  useTicker(!calm && (city || steam || scene.theme === "dark"));
  useEffect(() => { if (compiled) onReady(); }, [compiled, onReady]);
  const slot = (pattern: RegExp, object: Object3D) => { const match = pattern.exec(object.name); return match ? Number(match[1]) : -1; };
  const pickNote = (object: Object3D) => scene.data.notes[slot(/^(?:card|cardbody|pin)-(\d)/, object)]?.slug;
  const noteTitle = (object: Object3D) => scene.data.notes[slot(/^(?:card|cardbody|pin)-(\d)/, object)]?.title;
  const company = (object: Object3D) => scene.data.jobs.slice(1)[slot(/^(?:lanyard|badgebody|badge)-(\d)/, object)]?.company; // the hook starts at the second job
  const p = room.parts;
  return (
    <>
      <primitive object={room.root} />
      {compiled && <Light room={room} scene={scene} />}
      <Motion room={room} scene={scene} />
      <Content room={room} data={scene.data} workIndex={scene.workIndex} terminal={scene.terminal} minute={minute} city={city} skyTheme={scene.theme} reading={scene.open === "notes" ? scene.note : null} />
      <Life room={room} steam={steam} />
      <mesh rotation={[-Math.PI / 2, 0, .35]} position={[-0.515, 0.7705, -0.02]} raycast={() => {}}>
        <planeGeometry args={[0.34, 0.24]} />
        <shaderMaterial transparent depthWrite={false} vertexShader={VERT} fragmentShader={`varying vec2 vUv; void main() { vec2 q=(vUv-.5)*2.; gl_FragColor=vec4(.16,.10,.06,.14*exp(-dot(q,q)*3.)); }`} />
      </mesh>
      <Hot id="blog" label="Blog" object="Newspaper" at={[-0.5, 0.86, 0.16]} lift={[0, 0.025, 0]} part={p.blog} scene={scene} />
      <Hot id="notes" label="Field notes" object="Corkboard" at={[-0.8, 1.76, -0.78]} lift={[0, 0, 0.01]} part={p.notes} scene={scene} pick={pickNote} describe={noteTitle} />
      <Hot id="work" label="Work" object="Computer" at={[-0.05, 1.38, -0.17]} lift={[0, 0.006, 0]} part={p.work} scene={scene} />
      {p.now && <Hot id="now" label="Now" object="Work badge" at={[-0.14, 1.76, -0.78]} lift={[0, 0, 0.01]} pad={0.015} part={p.now} scene={scene} />}
      <Hot id="experience" label="Experience" object="Badges" at={[0.72, 1.3, -0.78]} lift={[0, 0, 0.01]} pad={0.015} part={p.experience} scene={scene} describe={company} />
      <Hot id="about" label="About" object="Frame" at={[-0.72, 0.98, 0.28]} lift={[0, 0.01, 0]} pad={0.02} part={p.about} scene={scene} />
      <Hot id="contact" label="Contact" object="Phone" at={[0.39, 0.97, 0.18]} lift={[0, 0.02, 0]} pad={0.02} part={p.contact} scene={scene} />
      <Hot id="activity" label="Activity" object="Calendar" at={[1.39, 1.73, -0.79]} lift={[0, 0, 0.01]} part={p.activity} scene={scene} />
      <Hot id="lamp" label="Room lights" object={scene.theme === "dark" ? "Turn on" : "Turn off"} at={[-0.4, 1.36, -0.08]} lift={[0, 0.005, 0]} part={p.lamp} scene={scene} />
    </>
  );
}

// --- Camera ------------------------------------------------------------------------------

// Moves between the room view and each object's close-up; in the room view the mouse leans the camera a little.
function Rig({ open, reducedMotion }: Pick<SceneProps, "open" | "reducedMotion">) {
  const { camera, invalidate, gl, pointer, size, scene: world } = useThree();
  const route = useRef<{ end: Vector3; height: number; retreat: boolean } | null>(null);
  const look = useRef(new Vector3(...views.room.target));
  const from = useRef({ pos: camera.position.clone(), look: look.current.clone(), at: 0 });
  const lean = useRef(new Vector2());
  const pos = useMemo(() => new Vector3(), []), target = useMemo(() => new Vector3(), []);
  useEffect(() => {
    route.current = null;
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
    const aspect = size.width / size.height;
    const fov = !open && aspect > 16 / 9 ? MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(19)) * (16 / 9) / aspect)) : 38;
    const k = reducedMotion ? 1 : Math.min(1, (performance.now() - from.current.at) / 800);
    const wantX = open || reducedMotion ? 0 : pointer.x, wantY = open || reducedMotion ? 0 : pointer.y;
    lean.current.x += (wantX - lean.current.x) * 0.08;
    lean.current.y += (wantY - lean.current.y) * 0.08;
    pos.set(view.pos[0] + lean.current.x * 0.12, view.pos[1] + lean.current.y * 0.05, view.pos[2]);
    target.set(...view.target);
    // Frame small subjects in the centre of the area left of the reading panel.
    const framing = open === "about" ? { centre: [-0.72, 0.85, 0.28], height: 0.16 }
      : open === "now" ? { centre: [-0.14, 1.56, -0.793], height: 0.14 }
      : open === "experience" ? { centre: [0.72, 1.08, -0.76], height: 0.42 }
      : open === "activity" ? { centre: [1.39, 1.65, -0.79], height: 0.29 } : null;
    if (framing) {
      const distance = framing.height / (2 * Math.tan(fov * Math.PI / 360) * (open === "about" ? 0.7 : 0.5));
      const panel = size.width >= 1600 ? Math.min(480, size.width * 0.34) : Math.min(420, size.width * 0.38);
      const shift = (panel + 48) / size.width * distance * Math.tan(fov * Math.PI / 360) * size.width / size.height;
      const direction = open === "about" ? new Vector3(1.7, 0.25, 1).normalize() : open === "experience" ? new Vector3(0, 0.6, 1).normalize() : new Vector3(0, 0, 1);
      const right = new Vector3(direction.z, 0, -direction.x).normalize();
      target.set(framing.centre[0], framing.centre[1], framing.centre[2]);
      pos.copy(target).addScaledVector(direction, distance);
      target.addScaledVector(right, shift);
      if (open === "experience") {
        // Translate the whole frontal view so the badges fill the panel-free width.
        const distance = 0.36 * size.height / (2 * Math.tan(fov * Math.PI / 360) * 1.0 * (size.width - panel - 48));
        const offset = (panel + 48) / size.height * distance * Math.tan(fov * Math.PI / 360);
        target.set(0.72 + offset, 1.075, -0.756);
        pos.copy(target).add(new Vector3(0, 0, distance));
      }
    }
    // Test the camera's swept volume against the actual obstacle meshes once per flight.
    if (!route.current || route.current.end.distanceTo(pos) > 0.02) {
      const obstacles: Box3[] = [];
      world.traverse((object) => {
        if (/^(lamp-model|monitor-model|plant|shelf|shelf-bracket-\d)$/.test(object.name)) {
          obstacles.push(new Box3().setFromObject(object).expandByScalar(0.035));
        }
      });
      const point = new Vector3();
      const clears = (height: number) => {
        for (let i = 0; i <= 128; i++) {
          const t = i / 128;
          point.lerpVectors(from.current.pos, pos, t);
          point.y += 4 * height * t * (1 - t);
          if (obstacles.some((box) => box.containsPoint(point))) return false;
        }
        return true;
      };
      const height = [0, 0.15, 0.3, 0.5, 0.75, 1, 1.4].find(clears);
      route.current = { end: pos.clone(), height: height ?? 0, retreat: height === undefined };
    }
    const t = ease(k);
    if (route.current.retreat) {
      const waypoint = new Vector3(...views.room.pos);
      if (k < 0.5) camera.position.lerpVectors(from.current.pos, waypoint, ease(k * 2));
      else camera.position.lerpVectors(waypoint, pos, ease((k - 0.5) * 2));
    } else {
      camera.position.lerpVectors(from.current.pos, pos, t);
      camera.position.y += 4 * route.current.height * t * (1 - t);
    }
    look.current.lerpVectors(from.current.look, target, t);
    camera.lookAt(look.current);
    if ("fov" in camera) {
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    }

    if (k < 1 || Math.abs(wantX - lean.current.x) > 0.001 || Math.abs(wantY - lean.current.y) > 0.001) invalidate();
  });
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
      onCreated={({ gl, scene }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        scene.background = theme[props.theme].bg.clone(); // the Light fades these when the theme changes
        scene.fog = new Fog(scene.background, 4, 9);
      }}
      onPointerMissed={() => props.onHover(null)}
      aria-hidden
    >
      <Rig open={props.open} reducedMotion={props.reducedMotion} />
      <Suspense fallback={null}><Model {...props} /></Suspense>
    </Canvas>
  );
}

useGLTF.preload(ROOM);
