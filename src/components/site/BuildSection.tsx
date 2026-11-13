"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type SectionProps = { id: string; label: string; number?: string; data?: string; className?: string; children: ReactNode };

// Plain section wrapper. number/data stay on the DOM so the build HUD can read them.
export function BuildSection({ id, label, number, data, className, children }: SectionProps) {
  return (
    <section id={id} className={className} aria-label={label} data-number={number} data-log={data}>
      {children}
    </section>
  );
}

const fallbackMs = 600; // Matches var(--step-ms, 600ms) in site.css.
const hiddenSteps = new Set(["wait", "blueprint", "frame", "fill", "skeleton"]);
const SELECTED = 3; // trailing characters shown as a blue selection behind the caret

function readStepMs(el: HTMLElement) {
  const raw = (el.style.getPropertyValue("--step-ms") || getComputedStyle(el).getPropertyValue("--step-ms")).trim();
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return fallbackMs;
  return raw.endsWith("ms") || !raw.endsWith("s") ? value : value * 1000;
}

// Types `text` one character at a time while the nearest [data-build] element is in its
// `content` step, spread evenly over `share` of that step's --step-ms. Hidden steps show
// nothing (the transparent ghost keeps the layout); no step or `done` shows the full text.
function Typed({ text, share = 1, className }: { text: string; share?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(text.length);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const host = ref.current?.closest<HTMLElement>("[data-build]");
    if (!host) return;
    let step: string | null | undefined;
    let ms = fallbackMs;
    let frame = 0;

    const sync = () => {
      ms = readStepMs(host);
      const next = host.getAttribute("data-step");
      if (next === step) return;
      step = next;
      cancelAnimationFrame(frame);
      if (next !== "content") {
        setTyping(false);
        setCount(next && hiddenSteps.has(next) ? 0 : text.length);
        return;
      }
      const start = performance.now();
      setTyping(true);
      setCount(0);
      const tick = (now: number) => {
        const typed = Math.min(text.length, Math.floor(((now - start) / (ms * share)) * text.length));
        setCount(typed);
        if (typed < text.length) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new MutationObserver(sync);
    observer.observe(host, { attributes: true, attributeFilter: ["data-step", "style"] });
    sync();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, share]);

  const active = typing && count < text.length;
  const selected = active ? Math.min(SELECTED, count) : 0;
  return (
    // One copy of the text only, so copy and find-in-page work on the finished page.
    // Pieces still being built are inert, so screen readers never read the partial text.
    <span ref={ref} className={className}>
      {text.slice(0, count - selected)}
      {selected > 0 && <span className="type-sel">{text.slice(count - selected, count)}</span>}
      {active && <span className="type-caret" />}
      <span className="type-ghost">{text.slice(count)}</span>
    </span>
  );
}

// A heading component: skeleton bars, then typed letter by letter across its content step,
// growing to full size as it goes (CSS scales the always inline-block .type-grow span).
export function TypeText({ as: Tag = "h2", text, className, name, decorative }: { as?: "h1" | "h2" | "h3" | "div"; text: string; className?: string; name?: string; decorative?: boolean }) {
  return (
    <Tag className={className} data-build="heading" data-text={text} data-name={name} aria-hidden={decorative || undefined}>
      <Typed text={text} className="type-grow" />
    </Tag>
  );
}

// A card's title slot: types during the first half of the card's content step.
export function CardTitle({ as: Tag = "h3", text, className }: { as?: "h3" | "b" | "span"; text: string; className?: string }) {
  return (
    <Tag className={className} data-slot="title" data-text={text}>
      <Typed text={text} share={0.5} />
    </Tag>
  );
}
