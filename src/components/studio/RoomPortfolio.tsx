"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, CornerDownLeft, Github } from "lucide-react";
import WorkstationScreen, { type ScreenPage } from "./WorkstationScreen";
import { desktopReducer, initialDesktop } from "./desktopState";
import { readScreenTheme, screenThemeKey, type ScreenTheme } from "./screenTheme";
import "./studio.css";

const RoomScene = dynamic(() => import("./RoomScene"), { ssr: false });
const ClassicPortfolio = dynamic(() => import("../ClassicPortfolio"));

class SceneBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function RoomPortfolio() {
  const [entered, setEntered] = useState(false);
  const [desktop, dispatch] = useReducer(desktopReducer, initialDesktop);
  const [classic, setClassic] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [revealDone, setRevealDone] = useState(false);
  const [skipReveal, setSkipReveal] = useState(false);
  const [screenFallback, setScreenFallback] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false);
  const [lowRecommended, setLowRecommended] = useState(false);
  const [reducedGraphics, setReducedGraphics] = useState(false);
  const [active, setActive] = useState(true);
  const [screenTheme, setScreenTheme] = useState<ScreenTheme>("light");
  const entrance = useRef<HTMLButtonElement>(null);
  const wasEntered = useRef(false);
  const stage = useRef<HTMLElement>(null);
  const markReady = useCallback(() => setReady(true), []);
  const markModelsReady = useCallback(() => setModelsReady(true), []);
  const markRevealDone = useCallback(() => setRevealDone(true), []);
  const markUnavailable = useCallback(() => { setUnavailable(true); setReady(true); }, []);

  useEffect(() => {
    try { setScreenTheme(readScreenTheme(window.localStorage.getItem(screenThemeKey))); } catch { /* Keep the default if storage is unavailable. */ }
    function update(event: StorageEvent) {
      if (event.key === screenThemeKey) setScreenTheme(readScreenTheme(event.newValue));
    }
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  useEffect(() => {
    if (classic) return;
    const hardware = navigator as Navigator & { deviceMemory?: number };
    setLowRecommended((hardware.deviceMemory ?? 8) <= 4 || (hardware.hardwareConcurrency || 8) <= 4 || window.matchMedia("(pointer: coarse)").matches);
    setDeviceReady(true);
    setActive(!document.hidden);
    let inView = true;
    const update = () => setActive(inView && !document.hidden);
    const observer = new IntersectionObserver(entries => { inView = entries[0]?.isIntersecting ?? false; update(); });
    if (stage.current) observer.observe(stage.current);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [classic]);

  function selectScreenTheme(next: ScreenTheme) {
    setScreenTheme(next);
    try { window.localStorage.setItem(screenThemeKey, next); } catch { /* Theme switching still works without persistence. */ }
  }

  useEffect(() => {
    if (!entered && wasEntered.current) {
      entrance.current?.focus();
    }
    wasEntered.current = entered;
  }, [entered]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 700px)");
    const update = () => { setReducedMotion(motion.matches); setMobile(compact.matches); };
    update(); motion.addEventListener("change", update); compact.addEventListener("change", update);
    return () => { motion.removeEventListener("change", update); compact.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !entered || event.defaultPrevented) return;
      if (desktop.active) dispatch({ type: "escape" });
      else setEntered(false);
    }
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [desktop.active, entered]);

  const enter = useCallback((next: ScreenPage = "home") => { if (next !== "home") dispatch({ type: "open", id: next }); setSkipReveal(true); setScreenFallback(!modelsReady); setEntered(true); setReady(false); }, [modelsReady]);
  const leave = useCallback(() => { setEntered(false); setReady(false); setScreenFallback(false); }, []);
  const compactScreen = (mobile || unavailable || screenFallback) && entered;
  const quality = reducedGraphics || lowRecommended ? "low" : "normal";
  const screenProps = { desktop, dispatch, theme: screenTheme, onTheme: selectScreenTheme, onLeave: leave, interactive: entered && ready };

  if (classic) return <div className="workstation-classic"><button className="workstation-classic-return" onClick={() => setClassic(false)}><ArrowLeft size={15} /> Back to the workstation</button><ClassicPortfolio /></div>;

  return (
    <div className={`workstation ${entered ? "workstation-entered" : ""}`} data-models-ready={modelsReady}>
      {!entered && <h1 className="sr-only">Ali Abdullah — full stack web and mobile developer</h1>}
      <header className="workstation-header"><button className="workstation-identity" onClick={leave} aria-label="Return to desk overview"><strong>ALI ABDULLAH</strong><span>Full stack developer / web & mobile</span></button><div>{entered ? <button className="workstation-back" onClick={leave}><ArrowLeft size={14} /> Step back</button> : <a href="https://github.com/AleeAbdullah" target="_blank" rel="noopener noreferrer"><Github size={15} /> GitHub <ArrowUpRight size={13} /></a>}</div></header>
      <main ref={stage} className="workstation-stage" aria-label="Ali's interactive workstation">
        {(!modelsReady || unavailable) && !entered && <Image className="workstation-poster" src="/workstation-poster.webp" width={620} height={490} alt="Ali's desk, vintage computer, and office chair" priority />}
        {deviceReady && <SceneBoundary onUnavailable={markUnavailable}><RoomScene entered={entered} reducedMotion={reducedMotion} compact={compactScreen} active={active} quality={quality} skipReveal={skipReveal} onEnter={enter} onReady={markReady} onModelsReady={markModelsReady} onRevealDone={markRevealDone} onUnavailable={markUnavailable} screenProps={{ ...screenProps, interactive: entered && ready && !compactScreen }} /></SceneBoundary>}
        {compactScreen && <div className="workstation-compact-screen"><WorkstationScreen {...screenProps} interactive /></div>}
        {!entered && <div className="workstation-scene-controls">{modelsReady && !revealDone && !reducedMotion && <button onClick={() => setSkipReveal(true)}>Skip intro</button>}<button aria-pressed={quality === "low"} disabled={lowRecommended} onClick={() => setReducedGraphics(value => !value)}>Graphics: {quality === "low" ? "reduced" : "full"}</button></div>}
      </main>
      <footer className="workstation-footer">{entered ? <><span className="workstation-instruction">{ready || compactScreen ? "Open a folder. Make yourself at home." : "Pulling up a chair…"}</span><span className="workstation-key-hint">ESC <span>to step back</span></span></> : <><div className="workstation-entrance"><p>A few ideas. A lot of work.<br /><span>It all starts at this desk.</span></p><button ref={entrance} className="workstation-enter-key" onClick={() => enter()}><span>Enter workstation</span><CornerDownLeft size={18} /></button></div><button className="workstation-standard" onClick={() => setClassic(true)}>Standard portfolio <ArrowUpRight size={13} /></button></>}</footer>
      <noscript>Ali Abdullah — full stack web and mobile developer. Contact ali.37803990@gmail.com or github.com/AleeAbdullah.</noscript>
    </div>
  );
}
