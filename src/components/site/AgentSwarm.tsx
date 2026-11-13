"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { agents, useBuild, useSwarm, type BuildSpeed } from "./buildMode";
import "./swarm.css";

const cursor = <svg width="14" height="20" viewBox="0 0 14 20"><path d="M0 0v16l4.4-3.9L7.6 19l2.7-1.2-3.2-6.7H13z" /></svg>;

// Positions are written straight to these elements by the engine's animation loop.
export function AgentSwarm() {
  const { enabled } = useBuild();
  const { phase, intro, crew, boxes, bindAgent, bindBox } = useSwarm();
  if (!enabled) return null;
  return (
    <div className="sw-layer" aria-hidden="true" style={{ "--intro": `${intro}ms` } as CSSProperties}>
      {phase === "intro" && <>
        <div className="sw-dim" />
        <div className="sw-tile"><b>AA</b><span>Scanning page…</span></div>
      </>}
      {boxes.map((box) => (
        <div key={box.key} ref={(el) => bindBox(box.key, el)} className={`sw-box${box.out ? " is-out" : ""}`}><span /></div>
      ))}
      {agents.map((agent, index) => {
        const state = crew[index];
        if (!agent.lead) return <div key={agent.id} ref={(el) => bindAgent(index, el)} className="sw-agent is-worker" style={{ "--c": agent.color } as CSSProperties}>{cursor}</div>;
        // Status chip: "<lead> · <verb> <piece>", with a progress line for the piece; the engine places it (--lx/--ly, --p).
        return (
          <div key={agent.id} ref={(el) => bindAgent(index, el)} className={`sw-agent${state?.idle === false ? "" : " is-idle"}`} style={{ "--c": agent.color, "--d": `${index * -0.7}s` } as CSSProperties}>
            {cursor}
            <b><em>{agent.id}</em> · {state?.label ?? "idle"}<i /></b>
          </div>
        );
      })}
    </div>
  );
}

const dots = agents.map((agent) => agent.color); // 4 lead colours, then the 10 neutral workers

export function BuildHud() {
  const { enabled } = useBuild();
  return enabled ? <Hud /> : null; // mounts fresh on every start, so "Build mode on." is announced each time
}

function Hud() {
  const { log, done, total, setEnabled, tour, paused, setTour, speed, setSpeed, replay } = useBuild();
  const finished = total > 0 && done === total;
  const [clicks, setClicks] = useState(0); // alternates two identical pulse animations so every click restarts it
  const [announced, setAnnounced] = useState(false);
  // Live regions only announce changes, so the first message lands just after the bar appears.
  useEffect(() => { const timer = setTimeout(() => setAnnounced(true), 300); return () => clearTimeout(timer); }, []);
  return (
    <div className="hud">
      <span className="hud-dots" aria-hidden="true">{dots.map((color, index) => <i key={index} className={index < 4 ? "is-lead" : ""} style={{ color }} />)}</span>
      <span className="hud-state">{agents.length} agents</span>
      <span className="hud-state hud-count">{done} / {total} layers</span>
      <span className="sr-only" aria-live="polite">{finished ? "Build complete." : paused ? "Tour paused, resumes shortly." : announced ? "Build mode on." : ""}</span>
      <span className="hud-log" aria-hidden="true">{log.slice(-2).map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</span>
      {/* Fixed-width buttons that swap in place, so no state change shifts the bar. */}
      <span className="hud-actions">
        <button className={`hud-speed${clicks ? (clicks % 2 ? " is-pulse" : " is-pulse-b") : ""}`} aria-label={`Build speed ${speed}×`} onClick={() => { setSpeed((speed === 3 ? 1 : speed + 1) as BuildSpeed); setClicks((n) => n + 1); }}>{speed}×</button>
        {finished
          ? <button className="hud-tour is-replay" aria-label="Replay the build from the top" onClick={replay}>Replay</button>
          : <button className="hud-tour" aria-pressed={tour} onClick={() => setTour(!tour)}>{paused ? "Paused" : "Tour"}</button>}
        <button className="hud-skip" aria-label={finished ? "Close build mode" : "Skip, show the finished page"} onClick={() => { setEnabled(false); focusSwitch(); }}>{finished ? "Done" : "Skip"}</button>
      </span>
      <i className="hud-progress" aria-hidden="true" style={{ transform: `scaleX(${total ? done / total : 0})` }} />
    </div>
  );
}

// The hero button is inside a piece that rebuilds (and goes inert), so keyboard focus moves to the nav switch.
const focusSwitch = () => requestAnimationFrame(() => document.querySelector<HTMLElement>(".build-switch")?.focus());

export function BuildSwitch() {
  const { available, enabled, setEnabled } = useBuild();
  if (!available) return null;
  return (
    <button className="build-switch" aria-pressed={enabled} onClick={() => setEnabled(!enabled)}>
      <span className="build-switch-track"><i /></span>Build mode
    </button>
  );
}

export function BuildInvite() {
  const { available, enabled, setEnabled } = useBuild();
  if (!available) return null;
  return (
    <button className="s-btn s-btn-primary" onClick={() => { setEnabled(true); focusSwitch(); }}>
      {enabled ? "Rebuild from here ↻" : "Watch agents build this site ▶"}
    </button>
  );
}
