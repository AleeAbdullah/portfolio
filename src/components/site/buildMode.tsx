"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

export type AgentId = "layout" | "type" | "data" | "polish";
export type Point = { x: number; y: number };
export type SwarmPhase = "intro" | "build" | "ship";
export type BuildSpeed = 1 | 2 | 3;
export type SwarmView = {
  phase: SwarmPhase;
  intro: number; // intro length in ms (shorter on Replay)
  crew: { label: string; idle: boolean }[];
  boxes: { key: number; out: boolean }[];
};

const leads: { id: AgentId; color: string }[] = [
  { id: "layout", color: "#4ADE80" },
  { id: "type", color: "#F472B6" },
  { id: "data", color: "#60A5FA" },
  { id: "polish", color: "#FACC15" },
];
export const WORKER_COLOR = "#A8A29E"; // idle workers are a neutral warm grey; on a crew they take the lead's colour
const WORKERS = 10;
/** 4 named leads (one per crew), then small unlabeled workers. */
export const agents: { id: string; color: string; lead: boolean }[] = [
  ...leads.map((agent) => ({ ...agent, lead: true })),
  ...Array.from({ length: WORKERS }, (_, i) => ({ id: `w${i + 1}`, color: WORKER_COLOR, lead: false })),
];

const kinds = ["heading", "text", "card", "chips", "block"] as const;
type Kind = (typeof kinds)[number];
type Step = "frame" | "fill" | "skeleton" | "content";

const sequence: Record<Kind, Step[]> = {
  heading: ["skeleton", "content"],
  text: ["skeleton", "content"],
  chips: ["skeleton", "content"],
  block: ["frame", "fill", "content"],
  card: ["frame", "fill", "skeleton", "content"],
};
const specialist: Record<Kind, AgentId> = { heading: "type", text: "type", card: "layout", block: "layout", chips: "data" };
const stepVerb: Record<Step, string> = { frame: "drawing", fill: "filling", skeleton: "blocking out", content: "" };
const contentVerb: Record<Kind, string> = { heading: "typing", text: "typing", card: "typing", chips: "placing", block: "polishing" };

// One-agent durations in ms. A crew of n works 1 + 0.35·(n − 1) times faster, capped at CREW_CAP.
const FRAME_MS = 350, FILL_MS = 250, SKELETON_MS = 300, SETTLE_MS = 250, SPEEDUP = 0.35, CREW_CAP = 2.2;
const QUICK_SKELETON_MS = 150, SHORT_TEXT = 40; // one-line pieces only get a quick blocking pass
const MAX_RUSH = 3; // with a big visible backlog crews work up to this many times faster…
const MAX_PACE = 4; // …but crew × rush never goes past this (build speed 1–3× multiplies on top)
const HOP_MS = 180; // shortest pause at each hop point
const ARRIVE_PX = 90, ARRIVE_MAX_MS = 650; // a crew starts once its lead is this close, or after this long
const MAX_JOBS = 4; // pieces in progress at once: one per lead, workers split between them
const SPECIALIST_PX = 600; // a free lead prefers a piece of its own kind when it is about this much farther away
const READY_PX = 60, READY_SHARE = 0.15, READY_MIN_PX = 16; // on screen enough to build: 15% of it or 60px, never a sliver
const NAV_INSET = 56, HUD_INSET = 76; // the fixed nav and bottom bar cover these edges of the viewport
const INTRO_MS = 1100, REPLAY_INTRO_MS = 500, WAVE_HOLD_MS = 900, CONSTRUCT_MAX_MS = 3000, SHIP_MS = 4500;
const MAX_BADGES = 10, BADGE_OUT_MS = 220, LATE_TAGS = 4, LATE_TAG_MS = 1000; // wave tags, then short tags on pieces scrolling in
const CURSOR_AXIS = -2.0; // the arrow svg points this way (radians); workers rotate from here to their heading
const WANDER = 18, IDLE_CRUISE = 60, IDLE_ORBIT = 0.55; // calm idle cloud: little wander, slow cruise, slow lead orbit
export const TOUR_PX_S = 100, TOUR_GRACE_MS = 400;
const TOUR_RESUME_MS = 2000; // a paused tour picks up again after this long without wheel or touch input
const TOUR_EASE_MS = 350; // how quickly the tour eases towards its target pace
const TOP_HOLD = 0.12, TALL = 0.35; // the tour waits while an unfinished piece (not a tall one) is in the top 12% of the band
const CHIP_H = 18; // status chip height, for collision checks
const BALL_R = 28; // the ending ball: every agent on its own tilted orbit within this radius (≈ 70px across with the arrows)
const AVOID_PX = 80; // the idle flock moves off a button the pointer is this close to
/** Shared between the engine and the tour loop: tour on, the pace (0–1) the engine wants, and the build speed. */
type Link = { on: boolean; pace: number; speed: BuildSpeed };

type Job = {
  el: HTMLElement; index: number; kind: Kind; name: string; text: string;
  title: HTMLElement | null; slots: HTMLElement[]; chips: HTMLElement[];
  ready: boolean; done: boolean; step: number; elapsed: number; ms: number;
  crew: Agent[]; hired: number; started: number; box: string | null;
};
type Agent = {
  id: string; lead: boolean; color: string; x: number; y: number; vx: number; vy: number; scale: number; angle: number; job: Job | null;
  radius: number; speed: number; phase: number; stiffness: number; gap: number; label: string; team: string; spot: number; cx: number; cy: number;
};
type SwarmDom = { agents: (HTMLElement | null)[]; boxes: Map<number, HTMLElement> };
type Ui = { reset: (line: string) => void; log: (line: string) => void; progress: (done: number, total: number) => void; view: (view: SwarmView) => void; waveDone: () => void };

type BuildState = {
  root: RefObject<HTMLDivElement | null>;
  available: boolean;
  enabled: boolean;
  setEnabled: (on: boolean) => void;
  log: string[];
  done: number;
  total: number;
  tour: boolean;
  paused: boolean;
  setTour: (on: boolean) => void;
  speed: BuildSpeed;
  setSpeed: (speed: BuildSpeed) => void;
  replay: () => void;
};
type SwarmState = SwarmView & { bindAgent: (index: number, el: HTMLElement | null) => void; bindBox: (key: number, el: HTMLElement | null) => void };

const BuildContext = createContext<BuildState | null>(null);
const SwarmContext = createContext<SwarmState | null>(null);
const emptyView: SwarmView = { phase: "build", intro: 0, crew: [], boxes: [] };

export function useBuild() {
  const value = useContext(BuildContext);
  if (!value) throw new Error("useBuild must be used inside BuildProvider");
  return value;
}

export function useSwarm() {
  const value = useContext(SwarmContext);
  if (!value) throw new Error("useSwarm must be used inside BuildProvider");
  return value;
}

const clean = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();
const short = (text: string) => { const t = text.replace(/[.,:;!?…]+$/, ""); return t.length > 26 ? `${t.slice(0, 25)}…` : t; };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const at = (r: DOMRect, fx: number, fy: number): Point => ({ x: r.left + r.width * fx, y: r.top + r.height * fy });
const wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
const grid = [[0.12, 0.3], [0.62, 0.22], [0.88, 0.6], [0.4, 0.75], [0.15, 0.82]] as const;
const inBand = (r: DOMRect, vh: number) => r.bottom > NAV_INSET && r.top < vh;
const toBand = (p: Point, vw: number, vh: number, pad = 8): Point => ({ x: Math.min(Math.max(p.x, pad), vw - pad), y: Math.min(Math.max(p.y, NAV_INSET + pad), vh - HUD_INSET - pad) });
const sizeOf = (w: number, h: number) => `${Math.round(w)} × ${Math.round(h)}`;

/** Ready once a meaningful part shows below the nav, bottom edge included: the bar covers only the middle of the
 * screen, so a piece beside it is visible and must not sit as an empty box. */
function isReady(r: DOMRect, vh: number) {
  const visible = Math.min(r.bottom, vh) - Math.max(r.top, NAV_INSET);
  return visible > 0 && visible >= Math.min(READY_PX, Math.max(r.height * READY_SHARE, Math.min(r.height, READY_MIN_PX)));
}

function makeJob(el: HTMLElement, index: number): Job {
  const kind = (kinds as readonly string[]).includes(el.dataset.build ?? "") ? (el.dataset.build as Kind) : "block";
  const slots = kind === "card" ? [...el.querySelectorAll<HTMLElement>("[data-slot]")] : [];
  const title = slots.find((slot) => slot.dataset.slot === "title") ?? null;
  const items = el.querySelectorAll<HTMLElement>(":scope > li");
  const chips = kind === "chips" ? [...(items.length ? items : (el.children as HTMLCollectionOf<HTMLElement>))] : [];
  const text = clean(kind === "heading" ? el.dataset.text ?? el.textContent : kind === "card" ? title?.dataset.text ?? title?.textContent : kind === "text" ? el.textContent : "");
  const name = clean(el.dataset.name) || text || clean(el.getAttribute("aria-label")) || (chips.length ? chips.map((chip) => clean(chip.textContent)).join(", ") : clean(el.textContent)) || kind;
  return { el, index, kind, name: short(name), text, title, slots, chips, ready: false, done: false, step: -1, elapsed: 0, ms: 0, crew: [], hired: 0, started: 0, box: null };
}

function contentMs(job: Job) {
  const n = job.text.length;
  if (job.kind === "heading") return Math.max(450, 35 * n);
  if (job.kind === "text") return Math.min(1400, 600 + 3 * n);
  if (job.kind === "card") return 1000 + 20 * n;
  if (job.kind === "chips") return Math.max(300, 80 * job.chips.length);
  return 500;
}

/** Where the typing currently is: a caret element if the markup renders one, else progress mapped along the text's lines. */
function caret(el: HTMLElement, p: number): Point {
  const mark = el.querySelector(".type-caret, [data-caret]")?.getBoundingClientRect();
  if (mark && (mark.width || mark.height)) return { x: mark.right + 2, y: mark.top + mark.height / 2 };
  const range = document.createRange();
  range.selectNodeContents(el);
  const lines: { left: number; right: number; top: number; bottom: number }[] = [];
  for (const r of range.getClientRects()) {
    if (r.width < 2 || r.height < 2) continue;
    const line = lines.find((l) => Math.abs(l.top - r.top) < r.height / 2);
    if (line) { line.left = Math.min(line.left, r.left); line.right = Math.max(line.right, r.right); line.bottom = Math.max(line.bottom, r.bottom); }
    else lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
  }
  if (!lines.length) { const r = el.getBoundingClientRect(); return at(r, p, 0.5); }
  lines.sort((a, b) => a.top - b.top);
  let distance = p * lines.reduce((sum, l) => sum + l.right - l.left, 0);
  for (const l of lines) {
    if (distance <= l.right - l.left) return { x: l.left + distance, y: (l.top + l.bottom) / 2 };
    distance -= l.right - l.left;
  }
  const end = lines[lines.length - 1];
  return { x: end.right, y: (end.top + end.bottom) / 2 };
}

/** Steps through `points`, resting on each. */
function hop(points: Point[], p: number, ms: number) {
  const hops = Math.max(1, Math.min(points.length, Math.floor(ms / HOP_MS)));
  return points[Math.min(hops - 1, Math.floor(p * hops))];
}

const progressOf = (job: Job) => (job.ms ? Math.min(1, job.elapsed / job.ms) : 1);
const stepOf = (job: Job) => (job.step >= 0 ? sequence[job.kind][job.step] : null);
/** The frame step's drawn share (0→1, eased): the lead drags the outline from top-left to bottom-right. */
const drawOf = (job: Job) => ease(progressOf(job));

/** Where the crew lead works right now. */
function leadPoint(job: Job, r: DOMRect): Point {
  const gridPoints = () => grid.map(([fx, fy]) => at(r, fx, fy));
  const step = stepOf(job);
  if (!step) return sequence[job.kind][0] === "frame" ? at(r, 0, 0) : gridPoints()[0]; // flying in to where the first step starts
  const p = progressOf(job);
  const rectPoint = (el: HTMLElement) => { const s = el.getBoundingClientRect(); return { x: s.left + Math.min(s.width, 180) * 0.6, y: s.top + s.height / 2 }; };

  if (step === "frame") return at(r, drawOf(job), drawOf(job)); // on the growing bottom-right corner
  if (step === "fill") {
    // Two eased passes across the piece.
    const s = p * 2, pass = Math.min(1, Math.floor(s)), f = ease(s - pass);
    return at(r, pass ? 1 - f : f, pass ? 0.72 : 0.28);
  }
  if (step === "skeleton") {
    const parts = job.slots.length ? job.slots : job.chips;
    return hop(parts.length ? parts.map(rectPoint) : gridPoints(), p, job.ms);
  }
  // Content: the lead sits on the reveal edge, so it and its chip cover only what isn't shown yet.
  if (job.kind === "heading") return caret(job.el, p);
  if (job.kind === "text") return at(r, p, 0.5);
  if (job.kind === "chips" && job.chips.length) {
    const chip = job.chips[Math.min(job.chips.length - 1, Math.floor(p * job.chips.length))].getBoundingClientRect();
    return { x: chip.left + chip.width / 2, y: chip.top + chip.height / 2 };
  }
  if (job.kind === "card") {
    // A cover (if any) gets a quick visit first, then the title is typed, then the remaining slots.
    const cover = job.slots.find((slot) => slot.dataset.slot === "cover");
    const q = cover ? Math.max(0, p - 0.15) / 0.85 : p;
    if (cover && p < 0.15) return hop([rectPoint(cover), at(cover.getBoundingClientRect(), 0.7, 0.7)], p / 0.15, job.ms * 0.15);
    if (q < 0.5 && job.title) return caret(job.title, q * 2);
    const rest = job.slots.filter((slot) => !["meta", "title", "cover"].includes(slot.dataset.slot ?? ""));
    if (rest.length) {
      const t = Math.max(0, q - 0.5) * 2 * rest.length, i = Math.min(rest.length - 1, Math.floor(t));
      const s = rest[i].getBoundingClientRect();
      return { x: s.left + s.width * Math.min(1, t - i), y: s.top + s.height / 2 };
    }
  }
  return hop(gridPoints(), p, job.ms);
}

/** Overall progress of a piece across all its steps (0→1). */
const jobProgress = (job: Job) => (job.step < 0 ? 0 : (job.step + progressOf(job)) / sequence[job.kind].length);

/** Workers hold their own spot on the piece's edge (j of m, evenly spread), creeping round slowly as the piece progresses. */
function station(job: Job, r: DOMRect, j: number, m: number): Point {
  if (r.height < 60) {
    // Short pieces: alternate along the top and bottom edges, spaced out, never piled on the text.
    const per = Math.ceil(m / 2), slot = Math.floor(j / 2);
    return { x: r.left + r.width * ((slot + 0.5) / per) * (1 - 0.05) + r.width * 0.05 * jobProgress(job), y: j % 2 ? r.bottom + 6 : r.top - 6 };
  }
  const w = Math.max(r.width - 12, 1), h = Math.max(r.height - 12, 1), perimeter = 2 * (w + h);
  let s = (((j + 0.5) / m + 0.1 * jobProgress(job)) % 1) * perimeter;
  const x = r.left + 6, y = r.top + 6;
  if (s < w) return { x: x + s, y };
  if ((s -= w) < h) return { x: x + w, y: y + s };
  if ((s -= h) < w) return { x: x + w - s, y: y + h };
  return { x, y: y + h - (s - w) };
}

/** Leads orbit a point; each has its own radius, speed and phase, the radius breathes and a little layered
 * noise (sines at unrelated rates) keeps the loop from looking drawn. */
function orbit(a: Agent, center: Point, seconds: number, pace = 1): Point {
  const angle = a.phase + seconds * a.speed * pace + 0.35 * Math.sin(seconds * 0.47 + a.phase * 2.3);
  const radius = a.radius * (1 + 0.18 * Math.sin(seconds * 0.8 + a.phase) + 0.08 * Math.sin(seconds * 1.9 + a.phase * 4.1));
  return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
}

/** The bottom-right corner nest: idle workers always wait here (leads too when the pointer is outside the window),
 * drifting a little with layered sines so the group looks alive without pulling the eye. */
function rest(a: Agent, i: number, seconds: number, vw: number, vh: number): Point {
  if (a.lead) return { x: vw - 56 - (i % 2) * 34, y: vh - 124 - Math.floor(i / 2) * 30 };
  const j = i - leads.length;
  const dx = Math.sin(seconds * 0.53 + a.phase * 3.1) * 6 + Math.sin(seconds * 1.31 + a.phase) * 3;
  const dy = Math.cos(seconds * 0.61 + a.phase * 2.7) * 5 + Math.sin(seconds * 1.07 + a.phase * 1.9) * 3;
  // Beside the bottom bar (it only spans the middle of the screen), so the nest never sits on page content.
  return { x: vw - 36 - (j % 5) * 22 + dx, y: vh - 56 + Math.floor(j / 5) * 24 + dy };
}

/** Boids for idle workers: a breathing ring around `center` they cruise along, plus separation, alignment and cohesion. */
function flock(a: Agent, mates: Agent[], center: Point, radius: number, cruise: number, seconds: number): Point {
  const dx = a.x - center.x, dy = a.y - center.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  const want = radius * (1 + 0.15 * Math.sin(seconds * 0.6 + a.phase));
  const swirl = cruise * a.speed;
  // The pull towards the ring grows with (speed / radius)², so fast, tight orbits (the ending ball) hold their radius.
  const pull = 4 + 1.5 * (swirl / want) ** 2;
  let ax = ux * (want - d) * pull + (-uy * swirl - a.vx) * 1.4;
  let ay = uy * (want - d) * pull + (ux * swirl - a.vy) * 1.4;
  ax += Math.cos(seconds * 1.1 + a.phase * 3) * WANDER; // a little wander so the ring never looks drawn
  ay += Math.sin(seconds * 0.9 + a.phase * 2) * WANDER;
  let n = 0, vx = 0, vy = 0, px = 0, py = 0;
  for (const b of mates) {
    if (b === a) continue;
    const ex = a.x - b.x, ey = a.y - b.y, e = Math.hypot(ex, ey);
    if (e > 90) continue;
    if (e < 32) { const push = ((32 - e) * 40) / (e || 1); ax += ex * push; ay += ey * push; }
    n++; vx += b.vx; vy += b.vy; px += b.x; py += b.y;
  }
  if (n) {
    ax += (vx / n - a.vx) * 0.8 + (px / n - a.x) * 0.6;
    ay += (vy / n - a.vy) * 0.8 + (py / n - a.y) * 0.6;
  }
  return { x: ax, y: ay };
}

/** A lead's status chip text; an agent that stops working keeps its last text so the fading chip never flashes "idle". */
function labelOf(a: Agent) {
  const job = a.job, step = job && stepOf(job);
  if (a.lead && job && step) a.label = `${step === "content" ? contentVerb[job.kind] : stepVerb[step]} ${job.name}`;
  return a.label;
}

function startBuild(root: HTMLElement, swarm: Agent[], dom: SwarmDom, pointer: { current: Point | null }, link: Link, ui: Ui, introMs = INTRO_MS) {
  const els = [...root.querySelectorAll<HTMLElement>("[data-build]")];
  const firstRects = els.map((el) => el.getBoundingClientRect());
  const jobs = els.map(makeJob);
  const t0 = performance.now(), waveAt = t0 + introMs;
  const wave = new Set<Job>();
  const buttons = [...root.querySelectorAll<HTMLElement>("button, .s-btn")]; // the idle flock keeps off these
  const badges = new Map<Job, { label: string; until: number; outAt: number; late: boolean }>();
  let done = 0, raf = 0, last = t0, viewKey = "", backlog = 0, waved = false, constructing = true, shipAt = 0;

  const finish = (job: Job, instant: boolean) => {
    job.done = true;
    for (const a of job.crew) a.job = null;
    job.crew = [];
    job.box = null;
    job.el.style.setProperty("--step-ms", instant ? "0ms" : `${SETTLE_MS}ms`);
    job.el.style.removeProperty("--draw");
    job.el.dataset.step = "done";
    job.el.inert = false;
    delete job.el.dataset.busy;
    done += 1;
    if (!instant) ui.log(`✓ ${job.name} ${((performance.now() - job.started) / 1000).toFixed(1)}s`);
    if (done === jobs.length) ui.log(`✓ shipped · Ali + ${swarm.length} agents`);
    ui.progress(done, jobs.length);
  };

  const startStep = (job: Job, r: DOMRect) => {
    const step = sequence[job.kind][job.step];
    const quick = step === "skeleton" && (job.kind === "text" || job.kind === "heading") && job.text.length <= SHORT_TEXT;
    const base = step === "frame" ? FRAME_MS : step === "fill" ? FILL_MS : step === "skeleton" ? (quick ? QUICK_SKELETON_MS : SKELETON_MS) : contentMs(job);
    // Normal pace with up to 2 pieces waiting, rising to MAX_RUSH× at 8 waiting; build speed multiplies on top.
    const rush = Math.min(MAX_RUSH, 1 + Math.max(0, backlog - 2) / 3);
    const crew = Math.min(CREW_CAP, 1 + SPEEDUP * (job.crew.length - 1));
    job.ms = Math.round(base / (Math.min(MAX_PACE, crew * rush) * link.speed));
    job.elapsed = 0;
    job.el.style.setProperty("--step-ms", `${job.ms}ms`);
    if (step === "frame") job.el.style.setProperty("--draw", "0");
    else job.el.style.removeProperty("--draw");
    job.el.dataset.step = step;
    const boxed = step === "frame" || (step === "skeleton" && (job.kind === "heading" || job.kind === "text"));
    job.box = boxed ? sizeOf(r.width, r.height) : null;
    // Log lines stay short enough for the bottom bar.
    const lead = job.crew[0].id;
    const say = (verb: string, what: string) => ui.log(`${lead} ▸ ${verb === lead ? "" : `${verb} `}${what}`); // "type ▸ X", not "type ▸ type X"
    if (step === "frame") say("draw", job.name);
    else if (step === "content" && job.kind === "chips") ui.log(`${lead} ▸ ${job.chips.length} chips`);
    else if (step === "content" && job.kind !== "block") say("type", job.name);
  };

  /** Workers each active crew should have: split as evenly as possible, earlier pieces get the extras. */
  const quotas = (active: Job[]) => {
    const sorted = [...active].sort((a, b) => a.index - b.index);
    return new Map(sorted.map((job, i) => [job, Math.floor(WORKERS / sorted.length) + (i < WORKERS % sorted.length ? 1 : 0)]));
  };
  const workersOf = (job: Job) => job.crew.length - 1;

  const tick = (now: number) => {
    const dt = Math.min(Math.max(now - last, 0), 100);
    last = now;
    const vw = window.innerWidth, vh = window.innerHeight, band = vh - NAV_INSET - HUD_INSET;

    // 1. Read every pending component once: scrolled past → finish instantly.
    const rects = new Map<Job, DOMRect>();
    const shown: DOMRect[] = []; // finished pieces on screen; chips and tags try not to cover them
    for (const job of jobs) {
      if (job.done) {
        const r = job.el.getBoundingClientRect();
        if (r.bottom > NAV_INSET && r.top < vh) shown.push(r);
        continue;
      }
      const r = job.el.getBoundingClientRect();
      if (r.bottom < NAV_INSET || (!r.width && !r.height)) finish(job, true); // scrolled past, or not rendered at all
      else rects.set(job, r);
    }

    // 2. The wave: after the intro every unstarted piece on screen turns to blueprint at once; after that,
    // pieces turn blueprint as soon as any part scrolls into the band, and are ready once a meaningful part shows.
    if (!waved && now >= waveAt) {
      waved = true;
      for (const [job, r] of rects) {
        if (job.step >= 0) continue;
        if (inBand(r, vh)) wave.add(job);
        else job.el.dataset.step = "wait"; // was on screen at the start, scrolled away during the intro
      }
      [...wave].filter((job) => { const r = rects.get(job)!; return r.width >= 60 && r.height >= 24; })
        .sort((a, b) => { const p = rects.get(a)!, q = rects.get(b)!; return q.width * q.height - p.width * p.height; })
        .slice(0, MAX_BADGES)
        .forEach((job) => { const r = rects.get(job)!; badges.set(job, { label: sizeOf(r.width, r.height), until: Infinity, outAt: 0, late: false }); });
      ui.log(`blueprint · ${wave.size} layers`);
    }
    if (waved) {
      for (const [job, r] of rects) {
        if (job.step < 0 && job.el.dataset.step !== "blueprint" && inBand(r, vh)) {
          job.el.dataset.step = "blueprint";
          // Pieces scrolling in later get their own short-lived size tag.
          const late = [...badges.values()].filter((badge) => badge.late && !badge.outAt).length;
          if (late < LATE_TAGS && r.width >= 60 && r.height >= 24) badges.set(job, { label: sizeOf(r.width, r.height), until: now + LATE_TAG_MS, outAt: 0, late: true });
        }
        if (!job.ready && isReady(r, vh)) job.ready = true;
      }
    }

    // 3. Advance steps. A crew starts once its lead has flown in (never during the wave's hold);
    // surplus workers leave only at a step boundary.
    const quota = quotas(jobs.filter((job) => !job.done && job.crew.length));
    for (const job of jobs) {
      if (job.done || !job.crew.length) continue;
      const r = rects.get(job)!;
      if (job.step < 0) {
        if (now < waveAt + WAVE_HOLD_MS) continue;
        // Crews assigned together (a section entering) start together: once every lead has flown in, or at the cap.
        const arrived = (other: Job) => { const t = toBand(leadPoint(other, rects.get(other)!), vw, vh), lead = other.crew[0]; return Math.hypot(lead.x - t.x, lead.y - t.y) <= ARRIVE_PX; };
        const batch = jobs.filter((other) => !other.done && other.step < 0 && other.crew.length && other.hired === job.hired);
        if (now - job.hired < ARRIVE_MAX_MS && !batch.every(arrived)) continue;
        job.step = 0;
        job.started = now;
        job.el.dataset.busy = "";
        startStep(job, r);
        continue;
      }
      job.elapsed += dt;
      if (job.elapsed < job.ms) continue;
      job.step += 1;
      if (job.step >= sequence[job.kind].length) { finish(job, false); continue; }
      const surplus = workersOf(job) - (quota.get(job) ?? 0);
      if (surplus > 0) for (const a of job.crew.splice(job.crew.length - surplus)) a.job = null;
      startStep(job, r);
    }

    // 4. Divide and conquer: each free lead takes a piece (at most MAX_JOBS at once), choosing the nearest of the
    // next few ready pieces in reading order; then free workers join the crews furthest below their quota.
    const active = jobs.filter((job) => !job.done && job.crew.length);
    const pool = jobs.filter((job) => job.ready && !job.done && !job.crew.length && rects.has(job));
    backlog = pool.length;
    if (waved) {
      // No piece stays a blank wireframe while a crew is free: with nothing ready, any blueprint piece will do.
      if (!pool.length) pool.push(...jobs.filter((job) => !job.done && !job.crew.length && job.el.dataset.step === "blueprint" && rects.has(job)));
      for (const lead of swarm.filter((a) => a.lead && !a.job)) {
        if (active.length >= MAX_JOBS || !pool.length) break;
        const cost = (job: Job) => { const r = rects.get(job)!; return Math.hypot(lead.x - r.left - r.width / 2, lead.y - r.top - r.height / 2) - (lead.id === specialist[job.kind] ? SPECIALIST_PX : 0); };
        const job = pool.slice(0, MAX_JOBS).reduce((best, next) => (cost(next) < cost(best) ? next : best));
        pool.splice(pool.indexOf(job), 1);
        lead.job = job;
        job.crew = [lead];
        job.hired = now;
        active.push(job);
      }
      const want = quotas(active), free = swarm.filter((a) => !a.lead && !a.job);
      while (free.length) {
        let job: Job | null = null, gap = 0;
        for (const next of active) { const d = (want.get(next) ?? 0) - workersOf(next); if (d > gap) { job = next; gap = d; } }
        if (!job) break;
        const r = rects.get(job)!, far = (a: Agent) => Math.hypot(a.x - r.left - r.width / 2, a.y - r.top - r.height / 2);
        const worker = free.reduce((best, a) => (far(a) < far(best) ? a : best));
        free.splice(free.indexOf(worker), 1);
        worker.job = job;
        job.crew.push(worker);
      }
    }

    if (constructing && waved && ([...wave].every((job) => job.done || job.step >= 0) || now > waveAt + CONSTRUCT_MAX_MS)) {
      constructing = false;
      delete root.dataset.construct;
      for (const badge of badges.values()) if (!badge.late) badge.until = Math.min(badge.until, now); // edge pieces drop theirs too
      ui.waveDone();
    }
    if (!shipAt && waved && done === jobs.length) shipAt = now;
    const phase: SwarmPhase = !waved ? "intro" : shipAt && now - shipAt < SHIP_MS ? "ship" : "build";

    // Tour pace: ease off while more pieces wait on screen than the crews can take, or while an unfinished
    // piece is about to scroll off the top; full speed once caught up.
    const waiting = pool.filter((job) => job.ready && inBand(rects.get(job)!, vh)).length;
    const nearTop = [...rects].some(([job, r]) => job.ready && r.height <= band * TALL && r.top < NAV_INSET + band * TOP_HOLD && r.bottom > NAV_INSET);
    link.pace = nearTop ? 0 : Math.max(0, Math.min(1, 1 - (waiting - MAX_JOBS) / MAX_JOBS));

    // 5. Physics: every agent rides a critically damped spring (no overshoot) to its target, except idle workers,
    // which flock (boids), and a lead drawing a frame, which rides the growing corner exactly.
    const seconds = now / 1000;
    const tile = { x: vw / 2, y: NAV_INSET + band / 2 };
    let center: Point | null = null, ring = 130, cruise = IDLE_CRUISE, pace = IDLE_ORBIT;
    if (phase === "intro") { center = tile; ring = 95; cruise = 240; pace = 1.6; }
    else if (phase === "ship") {
      // One tight ball in the open space right of the contact block, level with its heading, clear of the bars.
      const r = (root.querySelector("#contact h2") ?? root.querySelector("#contact"))?.getBoundingClientRect();
      center = toBand({ x: vw * 0.74, y: r ? r.top + r.height / 2 : tile.y }, vw, vh, 60);
    } else if (pointer.current) {
      // Near a button the flock's centre moves away from it, so the cloud never sits on what the visitor is about to click.
      let c = pointer.current;
      for (const button of buttons) {
        const b = button.getBoundingClientRect(), nx = Math.min(Math.max(c.x, b.left), b.right), ny = Math.min(Math.max(c.y, b.top), b.bottom);
        const d = Math.hypot(c.x - nx, c.y - ny);
        if (d >= AVOID_PX || (!b.width && !b.height)) continue;
        let ux = c.x - (b.left + b.right) / 2, uy = c.y - (b.top + b.bottom) / 2;
        const len = Math.hypot(ux, uy) || 1; ux /= len; uy /= len;
        if (len < 1) { ux = 0; uy = -1; }
        const push = (ring + 40) * (1 - d / AVOID_PX);
        c = { x: c.x + ux * push, y: c.y + uy * push };
      }
      center = toBand(c, vw, vh, 120); // the leads' orbit (up to ~95px with its breathing) stays inside the band
    }
    const flockers = swarm.filter((a) => !a.lead && !a.job && phase === "intro");

    swarm.forEach((a, i) => {
      const job = a.job, r = job && rects.get(job);
      let target: Point | null = null, look = a.lead ? 0.7 : 0.6, exact = false;
      if (job && r) {
        const k = job.crew.indexOf(a);
        const drawn = stepOf(job) === "frame" ? new DOMRect(r.left, r.top, r.width * drawOf(job), r.height * drawOf(job)) : r; // workers ride the growing outline
        target = toBand(k === 0 ? leadPoint(job, r) : station(job, drawn, k - 1, job.crew.length - 1), vw, vh, 4);
        exact = k === 0 && stepOf(job) === "frame";
        if (a.lead) look = 1;
      } else if (phase === "ship" && center) {
        // The ending ball: each agent circles on its own tilted orbit, so together they read as one dense sphere.
        const angle = a.phase * 2.1 + seconds * (2.2 + (i % 3) * 0.4) * (i % 2 ? -1 : 1), tilt = (i / swarm.length) * Math.PI;
        const radius = BALL_R * (0.55 + 0.45 * (((i * 7) % 5) / 4)), ox = Math.cos(angle) * radius, oy = Math.sin(angle) * radius * Math.cos(a.phase * 1.3);
        target = { x: center.x + ox * Math.cos(tilt) - oy * Math.sin(tilt), y: center.y + ox * Math.sin(tilt) + oy * Math.cos(tilt) };
        exact = true;
      } else if (!a.lead && phase !== "intro") target = rest(a, i, seconds, vw, vh); // idle workers wait in the corner nest beside the bar
      else if (!center) target = toBand(rest(a, i, seconds, vw, vh), vw, vh);
      else if (a.lead) target = toBand(orbit(a, center, seconds, pace), vw, vh); // only the 4 leads stay around the cursor

      if (exact && target) {
        const f = 1 - Math.exp(-dt / (phase === "ship" ? 70 : 25)), nx = lerp(a.x, target.x, f), ny = lerp(a.y, target.y, f);
        a.vx = dt ? ((nx - a.x) * 1000) / dt : 0; a.vy = dt ? ((ny - a.y) * 1000) / dt : 0;
        a.x = nx; a.y = ny;
      } else {
        const force = target ? null : flock(a, flockers, center!, ring, cruise, seconds);
        const damping = 2 * Math.sqrt(a.stiffness);
        for (let left = dt / 1000; left > 0; left -= 1 / 120) {
          const h = Math.min(left, 1 / 120);
          if (target) {
            a.vx += (a.stiffness * (target.x - a.x) - damping * a.vx) * h;
            a.vy += (a.stiffness * (target.y - a.y) - damping * a.vy) * h;
          } else {
            a.vx += force!.x * h;
            a.vy += force!.y * h;
            const v = Math.hypot(a.vx, a.vy);
            if (v > 900) { a.vx *= 900 / v; a.vy *= 900 / v; }
          }
          a.x += a.vx * h;
          a.y += a.vy * h;
        }
      }
      if (!target) {
        // Hitting an edge kills the outward velocity, so flocking agents slide off the wall instead of sticking to it.
        const c = toBand(a, vw, vh, 4);
        if (c.x !== a.x) a.vx = 0;
        if (c.y !== a.y) a.vy = 0;
        Object.assign(a, c);
      }
      a.scale += (look - a.scale) * (1 - Math.exp(-dt / 160));
      // Workers turn their arrow to face where they are going (smoothed; kept while nearly still).
      if (!a.lead && Math.hypot(a.vx, a.vy) > 40) a.angle += wrap(Math.atan2(a.vy, a.vx) - a.angle) * (1 - Math.exp(-dt / 140));
    });
    for (let pass = 0; pass < (phase === "ship" ? 0 : 2); pass++) { // the ending ball may overlap
      for (let i = 0; i < swarm.length; i++) {
        for (let j = i + 1; j < swarm.length; j++) {
          const a = swarm[i], b = swarm[j], gap = (a.gap + b.gap) / 2;
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d >= gap) continue;
          const nx = d > 0.01 ? dx / d : 1, ny = d > 0.01 ? dy / d : 0;
          // A lead drawing a frame stays on its corner; whoever it bumps moves the whole distance.
          const ea = a.job?.crew[0] === a && stepOf(a.job) === "frame", eb = b.job?.crew[0] === b && stepOf(b.job) === "frame";
          const pa = ea ? 0 : eb ? gap - d : (gap - d) / 2, pb = eb ? 0 : ea ? gap - d : (gap - d) / 2;
          a.x -= nx * pa; a.y -= ny * pa;
          b.x += nx * pb; b.y += ny * pb;
        }
      }
    }

    // Size tags fade out once their piece starts or their time is up, unless the piece's own frame/skeleton box takes over.
    for (const [job, badge] of badges) {
      if (job.done || (job.step >= 0 && job.box && !badge.outAt)) badges.delete(job);
      else if ((job.step >= 0 || now >= badge.until) && !badge.outAt) badge.outAt = now;
      else if (badge.outAt && now - badge.outAt > BADGE_OUT_MS) badges.delete(job);
    }

    // 6. Writes only from here on.
    const chips: { l: number; r: number; t: number; b: number }[] = []; // status chips placed this frame, so they never overlap
    swarm.forEach((a, i) => {
      const el = dom.agents[i];
      if (!el) return;
      const turn = a.lead ? "" : ` rotate(${(a.angle - CURSOR_AXIS).toFixed(3)}rad)`;
      el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)${turn} scale(${a.scale.toFixed(3)})`;
      const job = a.job;
      if (!a.lead) {
        // On a crew a worker takes its lead's colour, so each crew reads as one colour.
        const team = job ? job.crew[0].color : "";
        if (team !== a.team) { a.team = team; if (team) el.style.setProperty("--team", team); else el.style.removeProperty("--team"); }
        return;
      }
      const r = job && rects.get(job);
      if (!job || !stepOf(job) || !r) { a.cx = NaN; return; }
      el.style.setProperty("--p", jobProgress(job).toFixed(3));
      // The chip goes outside the piece so it never covers what is being revealed: above its top edge (following the
      // cursor across), below its bottom, or in the margin beside it. Only when none of those fit within the band and
      // clear of other chips does it fall back to a spot by the cursor.
      const w = (a.id.length + a.label.length + 3) * 6.1 + 14, lx = Math.min(Math.max(a.x - 12, r.left), r.right - w);
      const spots: [number, number][] = [
        [lx, r.top - CHIP_H - 6], [lx, r.bottom + 6], [r.right + 10, r.top], [r.left - w - 10, r.top],
        [a.x + 14, a.y + 14], [a.x - w - 10, a.y + 14], [a.x + 14, a.y - CHIP_H - 12], [a.x - w - 10, a.y - CHIP_H - 12],
      ];
      const hits = (l: number, t: number, o: { left: number; right: number; top: number; bottom: number }) => l < o.right && l + w > o.left && t < o.bottom && t + CHIP_H > o.top;
      const room = ([l, t]: [number, number]) => l >= 4 && l + w <= vw - 4 && t >= NAV_INSET + 2 && t + CHIP_H <= vh - HUD_INSET - 2 && !chips.some((o) => l < o.r + 6 && l + w > o.l - 6 && t < o.b + 4 && t + CHIP_H > o.t - 4);
      // Best: clear of other crews' pieces and of finished text too; otherwise just clear of other chips.
      const clean = (s: [number, number]) => room(s) && !shown.some((o) => hits(s[0], s[1], o)) && ![...rects].some(([other, o]) => other !== job && other.crew.length > 0 && hits(s[0], s[1], o));
      // Keep the last spot while it still fits, so nearby chips don't swap back and forth.
      if (!clean(spots[a.spot])) { const best = spots.findIndex(clean); a.spot = best >= 0 ? best : room(spots[a.spot]) ? a.spot : Math.max(0, spots.findIndex(room)); }
      const [l, t] = spots[a.spot];
      chips.push({ l, r: l + w, t, b: t + CHIP_H });
      // The chip eases to its spot (and snaps there when it first appears).
      if (Number.isNaN(a.cx)) { a.cx = l; a.cy = t; }
      else { const f = 1 - Math.exp(-dt / 90); a.cx = lerp(a.cx, l, f); a.cy = lerp(a.cy, t, f); }
      el.style.setProperty("--lx", `${(a.cx - a.x).toFixed(1)}px`);
      el.style.setProperty("--ly", `${(a.cy - a.y).toFixed(1)}px`);
    });
    const boxes: SwarmView["boxes"] = [];
    const tags: { l: number; r: number; t: number; b: number }[] = []; // tag rects placed this frame, so tags never stack
    let key = phase;
    for (const job of jobs) {
      const badge = badges.get(job);
      const r = rects.get(job);
      if (!(job.box || badge) || !r) continue;
      const out = !job.box && !!badge?.outAt;
      boxes.push({ key: job.index, out });
      key += `|${job.index}:${+out}`;
      // While a frame is being drawn, the piece (via --draw), its box and its tag grow with it, settling on the real size.
      const draw = stepOf(job) === "frame" ? drawOf(job) : 1;
      if (draw < 1 || stepOf(job) === "frame") job.el.style.setProperty("--draw", draw.toFixed(3));
      const el = dom.boxes.get(job.index);
      if (!el) continue;
      const bw = r.width * draw, bh = r.height * draw, label = job.box ? sizeOf(bw, bh) : badge!.label;
      el.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`;
      el.style.width = `${bw}px`;
      el.style.height = `${bh}px`;
      const tagEl = el.firstElementChild as HTMLElement | null; // its text comes from data-size, so React never re-renders per frame
      if (tagEl && tagEl.dataset.size !== label) tagEl.dataset.size = label;
      // The W × H tag sits under its box, or above it when the box's bottom is under the bar. A tag with no room,
      // or one that would land on a tag already placed this frame, is hidden rather than stacked.
      const bottom = r.top + bh, above = bottom + 26 > vh - HUD_INSET, tw = label.length * 6.5 + 14, cx = r.left + bw / 2;
      const tag = { l: cx - tw / 2, r: cx + tw / 2, t: above ? r.top - 22 : bottom + 4, b: above ? r.top - 4 : bottom + 22 };
      const over = (o: { left: number; right: number; top: number; bottom: number }) => tag.l < o.right && tag.r > o.left && tag.t < o.bottom && tag.b > o.top;
      const blocked = (above && tag.t < NAV_INSET) || tags.some((o) => tag.l < o.r && tag.r > o.l && tag.t < o.b && tag.b > o.t)
        || shown.some(over) || [...rects].some(([other, o]) => other !== job && over(o)) || chips.some((o) => tag.l < o.r && tag.r > o.l && tag.t < o.b && tag.b > o.t);
      if (!blocked) tags.push(tag);
      el.classList.toggle("is-above", above);
      el.classList.toggle("is-tagless", blocked);
    }
    const crew = swarm.map((a) => {
      const state = { label: labelOf(a), idle: !(a.lead && a.job && stepOf(a.job)) };
      key += `|${state.label}:${+state.idle}`;
      return state;
    });
    if (key !== viewKey) { viewKey = key; ui.view({ phase, intro: introMs, crew, boxes }); }
  };

  const loop = (now: number) => { tick(now); raf = requestAnimationFrame(loop); };
  const onVisibility = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); }
  };

  // Components above the fold stay finished. Pieces on screen keep their finished look through the intro
  // (inert, no data-step) so the wave flips them straight to blueprint; the rest wait for the visitor.
  ui.reset("scanning…");
  ui.progress(0, jobs.length);
  root.dataset.construct = "";
  const vh = window.innerHeight;
  jobs.forEach((job, i) => {
    if (firstRects[i].bottom < NAV_INSET) { finish(job, true); return; }
    job.el.inert = true;
    job.el.style.removeProperty("--step-ms");
    if (!inBand(firstRects[i], vh)) job.el.dataset.step = "wait";
  });
  // The whole swarm launches from the intro tile.
  const tile = { x: window.innerWidth / 2, y: NAV_INSET + (vh - NAV_INSET - HUD_INSET) / 2 };
  swarm.forEach((a, i) => Object.assign(a, { x: tile.x + Math.cos(i) * 12, y: tile.y + Math.sin(i) * 12, vx: 0, vy: 0, scale: 0.5, job: null, team: "", spot: 0, cx: NaN }));
  tick(last);
  raf = requestAnimationFrame(loop);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVisibility);
    delete root.dataset.construct;
    for (const a of swarm) a.job = null;
    for (const el of root.querySelectorAll<HTMLElement>("[data-build]")) {
      el.removeAttribute("data-step");
      el.removeAttribute("data-busy");
      el.inert = false;
      el.style.removeProperty("--step-ms");
      el.style.removeProperty("--draw");
    }
    ui.view(emptyView);
  };
}

const scrollKeys = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);

export function BuildProvider({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const [run, setRun] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [view, setView] = useState<SwarmView>(emptyView);
  const [tour, setTour] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<BuildSpeed>(1);
  const link = useRef<Link>({ on: false, pace: 1, speed: 1 });
  const autoTour = useRef(false); // cleared when the visitor scrolls or touches the Tour button before it auto-starts
  const enabledRef = useRef(false);
  const pointer = useRef<Point | null>(null);
  const dom = useRef<SwarmDom>({ agents: [], boxes: new Map() });
  const [swarm] = useState<Agent[]>(() => agents.map(({ id, lead, color }, i) => ({
    id, lead, color, x: NaN, y: NaN, vx: 0, vy: 0, scale: 0.6, angle: -Math.PI / 2, job: null, label: "idle", team: "", spot: 0, cx: NaN, cy: NaN,
    ...(lead
      ? { radius: 52 + i * 8, speed: (i % 2 ? -1 : 1) * (0.9 + i * 0.22), phase: i * 1.7, stiffness: 110 + i * 10, gap: 22 }
      : { radius: 0, speed: 0.8 + ((i * 37) % 10) / 20, phase: i * 2.3, stiffness: 120 + ((i * 53) % 9) * 5, gap: 14 }),
  })));

  useEffect(() => { link.current.speed = speed; }, [speed]);

  const setEnabled = useCallback((on: boolean) => {
    enabledRef.current = on;
    setEnabledState(on);
    if (on) setRun((n) => n + 1); // "Rebuild from here" and Replay restart even when already on
    else setTour(false);
  }, []);
  const quickIntro = useRef(false);
  const replay = useCallback(() => { window.scrollTo({ top: 0, behavior: "instant" }); quickIntro.current = true; setEnabled(true); }, [setEnabled]);
  const setTourByVisitor = useCallback((on: boolean) => { autoTour.current = false; setTour(on); }, []);

  // Layout effect: the wait states and first agent positions land before paint.
  useLayoutEffect(() => {
    const el = root.current;
    if (!enabled || !el) return;
    // The tour starts by itself once the first wave is under way, unless the visitor scrolled in the meantime.
    autoTour.current = true;
    let startY = window.scrollY;
    const settle = setTimeout(() => { startY = window.scrollY; }, TOUR_GRACE_MS); // inertia from the starting click doesn't count
    const stopBuild = startBuild(el, swarm, dom.current, pointer, link.current, {
      reset: (line) => setLog([line]),
      log: (line) => setLog((lines) => [...lines.slice(-2), line]),
      progress: (done, total) => setProgress({ done, total }),
      view: setView,
      waveDone: () => { if (autoTour.current && Math.abs(window.scrollY - startY) < 40) setTour(true); },
    }, quickIntro.current ? REPLAY_INTRO_MS : INTRO_MS);
    quickIntro.current = false;
    return () => { clearTimeout(settle); stopBuild(); };
  }, [enabled, run, swarm]);

  useEffect(() => {
    const move = (event: PointerEvent) => { if (event.pointerType !== "touch") pointer.current = { x: event.clientX, y: event.clientY }; };
    const out = (event: PointerEvent) => { if (!event.relatedTarget) pointer.current = null; };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", out);
    return () => { window.removeEventListener("pointermove", move); document.removeEventListener("pointerout", out); };
  }, []);

  // Escape stops the tour first, then is the keyboard way out of build mode.
  useEffect(() => {
    if (!enabled) return;
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (tour) { setTour(false); return; }
      const fromBar = !!document.activeElement?.closest(".hud");
      setEnabled(false);
      if (fromBar) requestAnimationFrame(() => document.querySelector<HTMLElement>(".build-switch")?.focus());
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [enabled, tour, setEnabled]);

  // Before the tour auto-starts, any scroll input from the visitor cancels it.
  useEffect(() => {
    if (!enabled || tour) return;
    const t0 = performance.now();
    const cancel = (event: Event) => {
      if (event.type === "keydown" ? scrollKeys.has((event as KeyboardEvent).key) : performance.now() - t0 > TOUR_GRACE_MS && (event.type === "touchstart" || Math.abs((event as WheelEvent).deltaY) > 4)) autoTour.current = false;
    };
    const events = ["wheel", "touchstart", "keydown"] as const;
    for (const type of events) window.addEventListener(type, cancel, { passive: true });
    return () => { for (const type of events) window.removeEventListener(type, cancel); };
  }, [enabled, tour, run]);

  // Tour: the page scrolls itself at the pace the engine asks for, times the build speed. Wheel or touch pauses
  // it (it resumes after TOUR_RESUME_MS without input); keys, links, the scrollbar, Escape, the bottom or build
  // mode ending stop it.
  useEffect(() => {
    if (!enabled || !tour) return;
    const t0 = performance.now(), state = link.current;
    let raf = 0, last = t0, y = window.scrollY, pace = 1, input = 0; // y keeps the fraction scrollY rounds away
    const stop = () => setTour(false);
    state.on = true;
    // Trackpad inertia from the click that started the tour is ignored.
    const swipe = (event: Event) => {
      if (performance.now() - t0 < TOUR_GRACE_MS || (event.type === "wheel" && Math.abs((event as WheelEvent).deltaY) <= 4)) return;
      if (!input) setPaused(true);
      input = performance.now();
    };
    const step = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      raf = requestAnimationFrame(step);
      if (input) {
        if (now - input < TOUR_RESUME_MS) return;
        input = 0; pace = 0; y = window.scrollY; // resume gently from wherever the visitor left the page
        setPaused(false);
      }
      if (Math.abs(window.scrollY - y) > 40) return stop(); // moved by the scrollbar or a link
      pace += (state.pace - pace) * (1 - Math.exp(-dt / TOUR_EASE_MS));
      const max = document.documentElement.scrollHeight - window.innerHeight;
      y = Math.min(max, y + (TOUR_PX_S * state.speed * pace * dt) / 1000);
      window.scrollTo({ top: y, behavior: "instant" });
      if (y >= max - 1) stop();
    };
    const jump = (event: MouseEvent) => { if ((event.target as Element | null)?.closest?.('a[href^="#"]')) stop(); }; // smooth anchor scrolls move too slowly to trip the check above
    const key = (event: KeyboardEvent) => {
      // Space on a focused control presses it (e.g. the Tour button itself) instead of scrolling.
      if (scrollKeys.has(event.key) && !(event.key === " " && (event.target as Element | null)?.closest?.("button, a, input, textarea, select"))) stop();
    };
    raf = requestAnimationFrame(step);
    window.addEventListener("wheel", swipe, { passive: true });
    window.addEventListener("touchstart", swipe, { passive: true });
    window.addEventListener("keydown", key);
    document.addEventListener("click", jump, true);
    return () => {
      cancelAnimationFrame(raf);
      state.on = false;
      setPaused(false);
      document.removeEventListener("click", jump, true);
      window.removeEventListener("wheel", swipe);
      window.removeEventListener("touchstart", swipe);
      window.removeEventListener("keydown", key);
    };
  }, [enabled, tour]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px), (pointer: coarse), (prefers-reduced-motion: reduce)");
    const update = () => {
      setAvailable(!query.matches);
      if (query.matches && enabledRef.current) setEnabled(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [setEnabled]);

  const bindAgent = useCallback((index: number, el: HTMLElement | null) => { dom.current.agents[index] = el; }, []);
  const bindBox = useCallback((key: number, el: HTMLElement | null) => {
    if (el) dom.current.boxes.set(key, el);
    else dom.current.boxes.delete(key);
  }, []);

  const build = useMemo(() => ({ root, available, enabled, setEnabled, log, ...progress, tour, paused, setTour: setTourByVisitor, speed, setSpeed, replay }), [available, enabled, setEnabled, log, progress, tour, paused, setTourByVisitor, speed, replay]);
  const swarmView = useMemo(() => ({ ...view, bindAgent, bindBox }), [view, bindAgent, bindBox]);

  return (
    <BuildContext.Provider value={build}>
      <SwarmContext.Provider value={swarmView}>{children}</SwarmContext.Provider>
    </BuildContext.Provider>
  );
}
