"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import CopyEmail from "../home/CopyEmail";
import NowPanel from "../home/NowPanel";
import { social } from "../home/links";
import { email } from "@/src/lib/portfolioData";
import { isSpot, spots, type DeskData, type Spot, type Target } from "./data";
import type { Terminal, Theme } from "./Scene";
import "../home/home.css";
import "./desk.css";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}

// Phones and touch-only tablets get a short note instead of the 3D room.
const blockedQuery = "(max-width: 900px), (hover: none) and (pointer: coarse)";

function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.dataset.theme === "light" ? "light" : "dark");
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch { /* The choice still applies for this visit. */ }
}

type Nodes = { bio: ReactNode; experience: ReactNode };

// The hidden terminal on the computer: a few read-only commands over the same data as the site.
function run(command: string, data: DeskData): { lines: string[]; open?: number; exit?: boolean } {
  const [name, ...rest] = command.trim().split(/\s+/);
  const arg = rest.join(" ");
  const list = (items: string[]) => items.map((item, i) => `  ${String(i + 1).padStart(2)}  ${item}`);
  switch (name) {
    case "": return { lines: [] };
    case "help": return { lines: ["whoami     who this is", "ls         what's on the desk", "work       projects (open <n> to show one)", "blog       long reads", "notes      field notes", "git log    what I've shipped lately", "contact    how to reach me", "clear      clear the screen", "exit       back to the desk"] };
    case "whoami": return { lines: ["Ali Abdullah. Software engineer at Ripeseed.io, Lahore.", "I build products end to end."] };
    case "ls": return { lines: arg ? run(arg.replace(/\/$/, "").replace("field-notes", "notes"), data).lines : ["blog/  notes/  work/  about.md  contact.md"] };
    case "work": case "projects": return { lines: [...list(data.projects.map((project) => project.title)), "Type open <n> to put one on the screen."] };
    case "open": {
      const n = Number(arg);
      if (!Number.isInteger(n) || n < 1 || n > data.projects.length) return { lines: [`open: pick a number from 1 to ${data.projects.length}`] };
      return { lines: [`Opening ${data.projects[n - 1].title}…`], open: n - 1, exit: true };
    }
    case "blog": return { lines: list(data.posts.map((post) => `${post.title} (${post.date})`)) };
    case "notes": return { lines: list(data.notes.map((note) => note.title)) };
    case "cat": return arg === "about.md" ? run("whoami", data) : arg === "contact.md" ? run("contact", data) : { lines: [`cat: ${arg || "?"}: no such file`] };
    case "git": return arg === "log" ? { lines: [`${data.activity.total.toLocaleString("en-US")} contributions in the last year.`, `Last commit: ${data.activity.lastActive}.`] } : { lines: ["git: try git log"] };
    case "contact": return { lines: [email, "github.com/AleeAbdullah"] };
    case "exit": return { lines: [], exit: true };
    default: return { lines: [`command not found: ${name}. Try help.`] };
  }
}

export default function Desk({ data, bio, experience }: { data: DeskData } & Nodes) {
  const [allowed, setAllowed] = useState<boolean>();
  const [fontsReady, setFontsReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [quality, setQuality] = useState<"normal" | "low">("normal");
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<Spot | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [workIndex, setWorkIndex] = useState(0);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [hover, setHover] = useState<Target | null>(null);
  const [pulse, setPulse] = useState<Spot | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);
  const theme = useTheme();
  const listButtons = useRef<Partial<Record<Spot, HTMLButtonElement | null>>>({});
  const title = useRef<HTMLHeadingElement>(null);
  const lastOpen = useRef<Spot | null>(null);

  useEffect(() => {
    const blocked = matchMedia(blockedQuery), motion = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { setAllowed(!blocked.matches); setReducedMotion(motion.matches); };
    update();
    blocked.addEventListener("change", update); motion.addEventListener("change", update);
    const hardware = navigator as Navigator & { deviceMemory?: number };
    if ((hardware.deviceMemory ?? 8) <= 4 || (hardware.hardwareConcurrency || 8) <= 4) setQuality("low");
    document.fonts.ready.then(() => setFontsReady(true));
    // Deep links: /desk?open=notes&note=<slug>
    const params = new URLSearchParams(location.search);
    const wanted = params.get("open");
    if (isSpot(wanted)) {
      setOpen(wanted);
      const slug = params.get("note");
      setNote(data.notes.some((item) => item.slug === slug) ? slug : null);
    }
    // The lamp intro plays once per visit, and not when arriving straight at an object.
    try {
      if (isSpot(wanted) || sessionStorage.getItem("desk-intro")) setSkipIntro(true);
      sessionStorage.setItem("desk-intro", "1");
    } catch { /* No storage: play it. */ }
    document.documentElement.classList.add("dk-page");
    return () => {
      blocked.removeEventListener("change", update); motion.removeEventListener("change", update);
      document.documentElement.classList.remove("dk-page");
    };
  }, [data.notes]);

  // Keep the address in step with what's open, so a close-up can be shared.
  useEffect(() => {
    const params = new URLSearchParams();
    if (open) params.set("open", open);
    if (open === "notes" && note) params.set("note", note);
    const query = params.toString();
    history.replaceState(null, "", query ? `?${query}` : location.pathname);
  }, [open, note]);

  const close = useCallback(() => { setOpen(null); setNote(null); setTerminal(null); }, []);
  const markReady = useCallback(() => setReady(true), []);
  const markIntroDone = useCallback(() => setIntroDone(true), []);
  const select = useCallback((target: Target, slug?: string) => {
    if (target === "lamp") { toggleTheme(); return; }
    setOpen(target);
    setNote(target === "notes" ? slug ?? null : null);
    if (target !== "work") setTerminal(null);
  }, []);

  // Focus moves to the panel title when something opens, and back to its list button on close.
  useEffect(() => {
    if (open) title.current?.focus({ preventScroll: true });
    else if (lastOpen.current) listButtons.current[lastOpen.current]?.focus({ preventScroll: true });
    lastOpen.current = open;
  }, [open, note]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (terminal) {
        if (event.metaKey || event.ctrlKey || event.altKey || event.key === "Tab") return;
        event.preventDefault();
        if (event.key === "Escape") setTerminal(null);
        else if (event.key === "Backspace") setTerminal({ ...terminal, input: terminal.input.slice(0, -1) });
        else if (event.key === "Enter") {
          if (terminal.input.trim() === "clear") { setTerminal({ lines: [], input: "" }); return; }
          const result = run(terminal.input, data);
          if (result.open !== undefined) setWorkIndex(result.open);
          setTerminal(result.exit ? null : { lines: [...terminal.lines, `ali@desk ~ % ${terminal.input}`, ...result.lines].slice(-40), input: "" });
        } else if (event.key.length === 1 && terminal.input.length < 48) setTerminal({ ...terminal, input: terminal.input + event.key });
        return;
      }
      if (event.key === "`" && open === "work") { event.preventDefault(); setTerminal({ lines: ["Type help to see what's here. Esc goes back."], input: "" }); return; }
      if (event.key === "Escape" && open) { event.preventDefault(); close(); }
      if (open === "work" && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
        const n = data.projects.length;
        setWorkIndex((i) => (i + (event.key === "ArrowRight" ? 1 : n - 1)) % n);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, data, terminal]);

  useEffect(() => {
    document.body.style.cursor = hover && !failed ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hover, failed]);

  // First visit: each object glows once, in turn, so people know they can be clicked.
  useEffect(() => {
    if (!introDone || reducedMotion) return;
    try { if (localStorage.getItem("desk-seen")) return; localStorage.setItem("desk-seen", "1"); } catch { return; }
    let i = 0;
    setPulse(spots[0].id);
    const timer = window.setInterval(() => {
      i += 1;
      if (i >= spots.length) { window.clearInterval(timer); setPulse(null); } else setPulse(spots[i].id);
    }, 420);
    return () => window.clearInterval(timer);
  }, [introDone, reducedMotion]);

  if (allowed === false) {
    return (
      <div className="hm dk dk-gate">
        <div>
          <p className="dk-kicker">The desk</p>
          <h1>Best on a computer.</h1>
          <p>The desk is a 3D room you explore with a mouse. Open it on a laptop or desktop, or head back to the site.</p>
          <Link href="/" className="dk-btn"><ArrowLeft aria-hidden /> Back to the portfolio</Link>
        </div>
      </div>
    );
  }

  const intro = ready && !introDone && !skipIntro && !reducedMotion && !failed;

  return (
    <div className="hm dk" data-open={open ?? undefined}>
      <h1 className="hm-sr">Ali Abdullah&apos;s desk</h1>
      {allowed && fontsReady && !failed && (
        <SceneBoundary onFail={() => setFailed(true)}>
          <Scene
            data={data} theme={theme} quality={quality} open={open} hover={hover} pulse={pulse} workIndex={workIndex} note={note} terminal={terminal}
            reducedMotion={reducedMotion} skipIntro={skipIntro} onReady={markReady} onIntroDone={markIntroDone}
            onHover={setHover} onSelect={select}
          />
        </SceneBoundary>
      )}
      {/* Shown while the room loads, and instead of it if 3D can't run. */}
      {(!introDone || failed) && <Image className="dk-poster" data-hidden={(ready && !failed) || undefined} src="/models/desk/poster.webp" alt="" fill priority sizes="100vw" />}
      {failed && <p className="dk-failed">The 3D room couldn&apos;t start in this browser. Everything in it is still here, in the list below.</p>}

      <header className="dk-top">
        <Link href="/" className="dk-chip"><ArrowLeft aria-hidden /> Portfolio</Link>
        <div className="dk-top-right">
          {intro && <button type="button" className="dk-chip" onClick={() => setSkipIntro(true)}>Skip intro</button>}
        </div>
      </header>

      <nav className="dk-list" aria-label="Things on the desk">
        {spots.map((spot) => (
          <button
            key={spot.id}
            ref={(el) => { listButtons.current[spot.id] = el; }}
            type="button"
            aria-expanded={open === spot.id}
            aria-controls="dk-panel"
            data-active={open === spot.id || undefined}
            onClick={() => (open === spot.id ? close() : select(spot.id))}
            onPointerEnter={() => setHover(spot.id)}
            onPointerLeave={() => setHover((current) => (current === spot.id ? null : current))}
            onFocus={() => setHover(spot.id)}
            onBlur={() => setHover((current) => (current === spot.id ? null : current))}
          >
            {spot.label}<span>{spot.object}</span>
          </button>
        ))}
        <button type="button" onClick={toggleTheme}>Room lights<span>{theme === "dark" ? "Off" : "On"}</span></button>
      </nav>

      {open && (
        <aside id="dk-panel" key={open} className="dk-panel" aria-labelledby="dk-panel-title">
          <div className="dk-panel-top">
            <span className="dk-kicker">{spots.find((spot) => spot.id === open)?.label}</span>
            <button type="button" className="dk-close" onClick={close}><ArrowLeft aria-hidden /> Back to room <kbd>Esc</kbd></button>
          </div>
          <PanelBody open={open} data={data} note={note} setNote={setNote} workIndex={workIndex} setWorkIndex={setWorkIndex} terminal={terminal} setTerminal={setTerminal} bio={bio} experience={experience} titleRef={title} />
        </aside>
      )}
    </div>
  );
}

type BodyProps = Nodes & {
  open: Spot; data: DeskData; note: string | null; setNote: (slug: string | null) => void;
  workIndex: number; setWorkIndex: (fn: (i: number) => number) => void; titleRef: React.RefObject<HTMLHeadingElement | null>;
  terminal: Terminal | null; setTerminal: (terminal: Terminal | null) => void;
};

function Draft({ draft }: { draft: boolean }) {
  return draft ? <span className="hm-draft">Draft</span> : null;
}

function PanelBody({ open, data, note, setNote, workIndex, setWorkIndex, terminal, setTerminal, bio, experience, titleRef }: BodyProps) {
  const heading = (text: ReactNode) => <h2 id="dk-panel-title" ref={titleRef} tabIndex={-1}>{text}</h2>;

  if (open === "blog") {
    const [lead, ...rest] = data.posts;
    if (!lead) return <>{heading("Nothing printed yet.")}<p>The first long read is on its way.</p></>;
    return (
      <>
        {heading(<>{lead.title} <Draft draft={lead.draft} /></>)}
        <p className="dk-meta">{lead.date} · {lead.minutes} min read</p>
        <p>{lead.summary}</p>
        <Link href={`/blog/${lead.slug}`} className="dk-btn">Read the full post <ArrowUpRight aria-hidden /></Link>
        {rest.length > 0 && (
          <ul className="dk-rows">
            {rest.map((post) => <li key={post.slug}><Link href={`/blog/${post.slug}`}><span>{post.title}</span><span className="dk-meta">{post.date}</span></Link></li>)}
          </ul>
        )}
        <Link href="/blog" className="dk-more">All posts <ArrowRight aria-hidden /></Link>
      </>
    );
  }

  if (open === "notes") {
    const current = data.notes.find((item) => item.slug === note);
    if (current) {
      return (
        <>
          <button type="button" className="dk-more dk-back" onClick={() => setNote(null)}><ArrowLeft aria-hidden /> All field notes</button>
          {heading(<>{current.title} <Draft draft={current.draft} /></>)}
          <p className="dk-meta">{current.date}</p>
          <div className="hm-prose dk-prose" dangerouslySetInnerHTML={{ __html: current.html }} />
        </>
      );
    }
    return (
      <>
        {heading("Field notes")}
        <p>Quick fixes, pinned up as I hit them. Pick a card.</p>
        <ul className="dk-rows">
          {data.notes.map((item) => <li key={item.slug}><button type="button" onClick={() => setNote(item.slug)}><span>{item.title} <Draft draft={item.draft} /></span><span className="dk-meta">{item.date}</span></button></li>)}
        </ul>
        <Link href="/field-notes" className="dk-more">Open on the site <ArrowRight aria-hidden /></Link>
      </>
    );
  }

  if (open === "work" && terminal) {
    return (
      <>
        {heading("Terminal")}
        <p>The screen is the terminal: just type. Try <kbd>help</kbd>. <kbd>Esc</kbd> goes back to the projects.</p>
        <p className="hm-sr" aria-live="polite">{terminal.lines.slice(-6).join(". ")}</p>
      </>
    );
  }

  if (open === "work") {
    const project = data.projects[workIndex];
    const step = (by: number) => setWorkIndex((i) => (i + by + data.projects.length) % data.projects.length);
    return (
      <>
        {heading(project.title)}
        <p>{project.description}</p>
        <div className="hm-tags">{project.techStack.slice(0, 6).map((tech) => <span key={tech} className="hm-tag">{tech}</span>)}</div>
        <div className="dk-links">
          {project.live && <a href={project.live} target="_blank" rel="noopener noreferrer" className="dk-more">Live <ArrowUpRight aria-hidden /></a>}
          {project.github && <a href={project.github} target="_blank" rel="noopener noreferrer" className="dk-more">Code <ArrowUpRight aria-hidden /></a>}
        </div>
        <div className="dk-pager">
          <button type="button" className="dk-chip" onClick={() => step(-1)} aria-label="Previous project"><ArrowLeft aria-hidden /></button>
          <span className="dk-meta">{workIndex + 1} / {data.projects.length} · use ← →</span>
          <button type="button" className="dk-chip" onClick={() => step(1)} aria-label="Next project"><ArrowRight aria-hidden /></button>
        </div>
        <Link href="/work" className="dk-more">All work <ArrowRight aria-hidden /></Link>
        <button type="button" className="dk-more dk-back" onClick={() => setTerminal({ lines: ["Type help to see what's here. Esc goes back."], input: "" })}>Developer? Open the terminal <kbd>`</kbd></button>
      </>
    );
  }

  if (open === "experience") return <>{heading("Where I've worked")}{experience}</>;

  if (open === "about") {
    return (
      <>
        {heading("Hi, I'm Ali.")}
        <div className="hm-prose dk-prose">{bio}</div>
        <Link href="/about" className="dk-more">More about me <ArrowRight aria-hidden /></Link>
      </>
    );
  }

  if (open === "contact") {
    return (
      <>
        {heading("Let's build something.")}
        <div className="hm-mail-row">
          <a className="hm-mail" href={`mailto:${email}`}>{email}</a>
          <CopyEmail email={email} />
        </div>
        <ul className="hm-social">
          {social.filter((link) => link.external).map(({ href, label, Icon }) => (
            <li key={label}><a href={href} target="_blank" rel="noopener noreferrer"><Icon aria-hidden className="hm-social-icon" />{label}<ArrowUpRight aria-hidden className="hm-social-go" /></a></li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <>
      {heading("What I'm shipping")}
      <p>{data.activity.total.toLocaleString("en-US")} GitHub contributions in the last year. The calendar on the wall is the same graph.</p>
      <NowPanel activity={data.activity} />
    </>
  );
}
