"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { Activity } from "@/src/lib/github";

const level = (count: number) => (count === 0 ? 0 : count < 5 ? 1 : count < 12 ? 2 : count < 19 ? 3 : 4);

// "Today", "Yesterday" or "N days ago", from the visitor's clock so it stays true between builds.
function since(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const now = new Date();
  const days = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, d)) / 864e5);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
}

// "12 contributions · Tue, Nov 3" for the cell `index` days after `start`.
function cellLabel(start: string, index: number, count: number) {
  const [y, m, d] = start.split("-").map(Number);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" })
    .format(new Date(Date.UTC(y, m - 1, d + index)));
  return `${count === 0 ? "No" : count} contribution${count === 1 ? "" : "s"} · ${day}`;
}

const lahoreTime = () => new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" }).format(new Date());

export default function NowPanel({ activity, children }: { activity: Activity; children?: ReactNode }) {
  // Both values depend on the visitor's clock, so they fill in after hydration.
  const [lastCommit, setLastCommit] = useState<string>();
  const [time, setTime] = useState<string>();
  useEffect(() => {
    const tick = () => { setTime(lahoreTime()); setLastCommit(since(activity.lastActive)); };
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [activity.lastActive]);

  // Hovered cell. On touch a tap keeps it open until the next tap outside the graph.
  const [tip, setTip] = useState<{ w: number; d: number }>();
  const graph = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tip) return;
    const close = (e: globalThis.PointerEvent) => { if (!graph.current?.contains(e.target as Node)) setTip(undefined); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [tip]);
  const hover = (e: PointerEvent<HTMLDivElement>) => {
    const cell = (e.target as HTMLElement).dataset;
    if (cell.w) setTip({ w: Number(cell.w), d: Number(cell.d) });
  };

  const recent = activity.weeks.flat().reduce((sum, count) => sum + count, 0);

  return (
    <section className="hm-now" aria-label="Now">
      <p className="hm-now-head">
        <span className="hm-now-status"><span className="hm-now-dot" aria-hidden />Shipping</span>
        <span className="hm-now-where">at Ripeseed.io</span>
      </p>
      <div
        ref={graph}
        className="hm-graph"
        role="img"
        aria-label={`${recent} GitHub contributions in the last 15 weeks`}
        onPointerOver={hover}
        onPointerLeave={(e) => { if (e.pointerType !== "touch") setTip(undefined); }}
      >
        {activity.weeks.map((week, w) => week.map((count, d) => (
          <i
            key={`${w}-${d}`}
            data-l={level(count)}
            data-w={w}
            data-d={d}
            data-on={tip?.w === w && tip.d === d ? "" : undefined}
            style={{ gridColumn: w + 1, gridRow: d + 1 }}
          />
        )))}
        <span
          className="hm-graph-tip"
          aria-hidden
          data-open={tip ? "" : undefined}
          data-side={!tip || (tip.w > 3 && tip.w < 9) ? "mid" : tip.w <= 3 ? "start" : "end"}
          style={tip ? { left: `${((tip.w + 0.5) / 15) * 100}%`, top: `${(tip.d / 7) * 100}%` } : undefined}
        >
          {tip && cellLabel(activity.start, tip.w * 7 + tip.d, activity.weeks[tip.w][tip.d])}
        </span>
      </div>
      <dl>
        <dt>Last commit</dt><dd>{lastCommit ?? " "}</dd>
        <dt>Lahore</dt><dd>{time ?? " "}</dd>
      </dl>
      {children}
    </section>
  );
}
