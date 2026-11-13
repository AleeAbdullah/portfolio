"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { ScreenTheme } from "./screenTheme";

const source = "/illustrations/roofing-proposal.html";

export default function RoofingExplainer({ theme = "light" }: { theme?: ScreenTheme }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const initialTheme = useRef(theme);
  const [height, setHeight] = useState(1100);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: "roofing-figure-theme", theme }, "*");
  }, [theme]);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    let inView = false;
    const reportVisibility = () => element.contentWindow?.postMessage({ type: "roofing-figure-visibility", visible: inView && !document.hidden }, "*");
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; reportVisibility(); }, { threshold: 0.01 });
    observer.observe(element);
    function receive(event: MessageEvent) {
      if (event.source !== element?.contentWindow || event.data?.type !== "roofing-figure-height") return;
      const next = event.data.height;
      if (typeof next !== "number" || !Number.isFinite(next) || next < 300 || next > 5000) return;
      setHeight(Math.ceil(next));
    }
    window.addEventListener("message", receive);
    document.addEventListener("visibilitychange", reportVisibility);
    element.addEventListener("load", reportVisibility);
    return () => {
      observer.disconnect();
      window.removeEventListener("message", receive);
      document.removeEventListener("visibilitychange", reportVisibility);
      element.removeEventListener("load", reportVisibility);
    };
  }, []);

  return <section className="roofing-explainer" aria-label="How a roofing proposal is built">
    <div className="roofing-explainer-heading"><span>Interactive walkthrough</span><a href={`${source}${theme === "dark" ? "?theme=dark" : ""}`} target="_blank" rel="noopener noreferrer">Open larger view <ArrowUpRight size={14} /></a></div>
    {!loaded && <p className="roofing-explainer-loading" role="status">Loading the proposal workflow…</p>}
    <iframe ref={frame} src={`${source}${initialTheme.current === "dark" ? "?theme=dark" : ""}`} title="How a roofing proposal is built" loading="lazy" sandbox="allow-scripts" style={{ height }} onLoad={() => { setLoaded(true); frame.current?.contentWindow?.postMessage({ type: "roofing-figure-theme", theme }, "*"); }} />
  </section>;
}
