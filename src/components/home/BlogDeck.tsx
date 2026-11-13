"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";

export type DeckPost = { slug: string; title: string; summary: string; date: string; minutes: number; tags: string[]; draft: boolean; cover: string };

// One motif per post, so cards in the stack are told apart by shape, not only by text.
function Motif({ kind }: { kind: string }) {
  if (kind === "roof") return (
    <svg className="hm-motif" viewBox="0 0 200 120" aria-hidden>
      <path d="M20 70 L100 18 L180 70" /><path d="M36 60 V104 H164 V60" /><path d="M86 104 V78 H114 V104" />
      <path className="hm-motif-dim" d="M20 112 H180" /><text x="100" y="12" textAnchor="middle">ROOF REPORT</text>
    </svg>
  );
  if (kind === "ledger") return (
    <svg className="hm-motif" viewBox="0 0 200 120" aria-hidden>
      {[24, 46, 68].map((y, i) => <g key={y}><path className="hm-motif-dim" d={`M24 ${y} H176`} /><text x="24" y={y - 6}>{["Groceries", "Fuel", "Settled"][i]}</text><text x="176" y={y - 6} textAnchor="end">{["1250", "3400", "-4650"][i]}</text></g>)}
      <path d="M24 92 H176" /><text x="24" y="108">Balance</text><text x="176" y="108" textAnchor="end">0</text>
    </svg>
  );
  return <svg className="hm-motif" viewBox="0 0 200 120" aria-hidden><path d="M30 30 H170 M30 56 H150 M30 82 H160" /></svg>;
}

const SWIPE = 60; // px a swipe must travel (or flick) to change cards
const LEAVE_MS = 240; // matches the card transition in home.css

export default function BlogDeck({ posts }: { posts: DeckPost[] }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false); // next: the top card fades out left while the stack moves forward
  const [entering, setEntering] = useState(false); // prev: the new top card starts at the left, then slides in
  const [touched, setTouched] = useState(false); // the "card behind" hint stops once it has been used
  const [drag, setDrag] = useState(0);
  const [fling, setFling] = useState<number | null>(null); // where a swipe was released, so the card keeps going left from there
  const start = useRef<{ x: number; t: number; moved: boolean } | null>(null);
  const deck = useRef<HTMLDivElement>(null);
  const refocus = useRef(false);
  const n = posts.length;
  const busy = leaving || entering;

  // The old front card goes inert when it moves back, so keyboard focus follows the new front card.
  const keepFocus = () => { refocus.current = !!deck.current?.querySelector(".hm-card:focus"); };
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    deck.current?.querySelector<HTMLElement>('.hm-card[data-slot="0"]')?.focus();
  }, [index]);

  const next = (from: number | null = null) => {
    if (n < 2 || busy) return;
    keepFocus(); setTouched(true); setLeaving(true); setFling(from);
    const wait = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : LEAVE_MS;
    window.setTimeout(() => { setIndex((i) => (i + 1) % n); setLeaving(false); setFling(null); }, wait);
  };
  const prev = () => {
    if (n < 2 || busy) return;
    keepFocus(); setTouched(true); setEntering(true); setIndex((i) => (i - 1 + n) % n);
    // Two frames so the start position is painted before the transition runs.
    requestAnimationFrame(() => requestAnimationFrame(() => setEntering(false)));
  };

  // Swipes follow the finger live, can be reversed until release, and a quick flick counts too.
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (n < 2 || busy || event.button !== 0) return;
    start.current = { x: event.clientX, t: performance.now(), moved: false };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const dx = event.clientX - start.current.x;
    if (!start.current.moved && Math.abs(dx) > 6) {
      start.current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (start.current.moved) setDrag(dx);
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s) return;
    const dx = event.clientX - s.x, speed = Math.abs(dx) / Math.max(1, performance.now() - s.t);
    setDrag(0);
    if (s.moved && (dx < -SWIPE || (dx < -20 && speed > 0.5))) next(dx);
    else if (s.moved && (dx > SWIPE || (dx > 20 && speed > 0.5))) prev();
    window.setTimeout(() => { start.current = null; }, 0);
  };

  if (!n) return null;

  return (
    <div
      ref={deck}
      className="hm-deck"
      data-touched={touched || undefined}
      data-count={Math.min(n, 3)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Latest blog posts"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); next(); }
        if (event.key === "ArrowLeft") { event.preventDefault(); prev(); }
      }}
    >
      <div
        className="hm-deck-stage"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => { setDrag(0); start.current = null; }}
      >
        {/* Every post is rendered in the same grid cell, keyed by slug, so the stage is as tall as the
            tallest card and a card keeps its node as it moves from the back to the front. */}
        {posts.map((post, i) => {
          const slot = (i - index + n) % n;
          const top = slot === 0;
          const shown = top ? 0 : leaving ? slot - 1 : slot;
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="hm-card"
              data-slot={shown > 2 ? "rest" : shown}
              data-leaving={(top && leaving) || undefined}
              data-entering={(top && entering) || undefined}
              data-dragging={top && drag ? "" : undefined}
              style={top && drag ? { transform: `translateX(${drag}px)` } : top && leaving && fling !== null ? { transform: `translateX(${fling - 80}px)` } : undefined}
              aria-hidden={!top || undefined}
              inert={!top}
              draggable={false}
              onClick={(event) => { if (start.current?.moved) event.preventDefault(); }}
            >
              <div className="hm-cover" aria-hidden>
                <span>Blog · {String(i + 1).padStart(2, "0")}</span>
                <Motif kind={post.cover} />
              </div>
              <div className="hm-card-body">
                <span className="hm-meta">{post.date} · {post.minutes} min read {post.draft && <span className="hm-draft">Draft</span>}</span>
                <h3>{post.title}</h3>
                <p>{post.summary}</p>
                <div className="hm-tags">{post.tags.map((tag) => <span key={tag} className="hm-tag">{tag}</span>)}</div>
              </div>
            </Link>
          );
        })}
        {/* The peeking edge of the next card: after the card in tab order, and labelled with the next title. */}
        {n > 1 && (
          <button type="button" className="hm-peek" onClick={() => next()}>
            <span className="hm-sr">Next post: </span><span className="hm-peek-title">{posts[(index + 1) % n].title}</span>
          </button>
        )}
      </div>
      {n > 1 && (
        <div className="hm-deck-foot">
          <span className="hm-meta" aria-live="polite">{index + 1} / {n}</span>
          {!touched && <span className="hm-hint"><span className="hm-hint-pointer">Click the card behind for the next post.</span><span className="hm-hint-touch">Swipe for the next post.</span></span>}
        </div>
      )}
    </div>
  );
}
