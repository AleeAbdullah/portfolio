"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import type { Activity } from "@/src/lib/github";
import { social } from "./links";
import NowPanel from "./NowPanel";
import "./home.css";

const nav = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/field-notes", label: "Field notes" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
];

// On the home page these nav items jump to the matching section and light up while it is in view;
// each section's own "All …" link goes on to the full page.
const sectionNav: Record<string, string> = { blog: "/blog", "field-notes": "/field-notes", work: "/work" };

const clean = (path: string) => (path.length > 1 ? path.replace(/\/$/, "") : path);

// The theme is set on <html> before paint (root layout), and CSS shows the matching label,
// so the button is right on first paint with no client state.
function ThemeToggle() {
  return (
    <button
      type="button"
      className="hm-theme"
      onClick={() => {
        const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem("theme", next); } catch { /* The choice still applies for this visit. */ }
      }}
    >
      <span className="hm-theme-to-light"><Sun aria-hidden /><span className="hm-sr">Switch to light theme</span></span>
      <span className="hm-theme-to-dark"><Moon aria-hidden /><span className="hm-sr">Switch to dark theme</span></span>
    </button>
  );
}

export default function Shell({ children, activity }: { children: ReactNode; activity: Activity }) {
  const path = clean(usePathname() ?? "/");
  const [drawer, setDrawer] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  // Close the drawer on navigation, and on Escape; focus moves into it when it opens and back when it closes.
  useEffect(() => { setDrawer(false); }, [path]);
  useEffect(() => {
    if (!drawer) return;
    firstLink.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);
  // On the home page the nav follows the section in view: the last one whose top has passed 35% of the window.
  const [section, setSection] = useState<string>();
  useEffect(() => {
    if (path !== "/") { setSection(undefined); return; }
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | undefined;
      for (const id of Object.keys(sectionNav)) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= innerHeight * 0.35) current = id;
      }
      setSection(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [path]);
  const lit = path === "/" ? (section && sectionNav[section]) || "/" : nav.find((item) => item.href !== "/" && path.startsWith(item.href))?.href;

  const close = () => { setDrawer(false); requestAnimationFrame(() => menuButton.current?.focus()); };

  return (
    <div className="hm" data-drawer={drawer || undefined}>
      <a href="#main" className="hm-skip" tabIndex={drawer ? -1 : undefined}>Skip to content</a>
      <header className="hm-top">
        <Link href="/" className="hm-top-name" tabIndex={drawer ? -1 : undefined}>Ali Abdullah</Link>
        <button ref={menuButton} type="button" className="hm-menu" aria-expanded={drawer} aria-controls="hm-side" onClick={() => setDrawer(!drawer)}>
          {drawer ? <X aria-hidden /> : <Menu aria-hidden />}
          <span>{drawer ? "Close" : "Menu"}</span>
        </button>
      </header>
      <button type="button" className="hm-scrim" aria-label="Close menu" tabIndex={-1} onClick={close} />

      <aside id="hm-side" className="hm-side" aria-label="Site">
        <div>
          <Link href="/" className="hm-name" style={{ textDecoration: "none" }}>Ali<br />Abdullah</Link>
          <p className="hm-role">Software engineer, web &amp; mobile.</p>
        </div>
        <NowPanel activity={activity} />
        <nav className="hm-nav" aria-label="Main">
          {nav.map((item, index) => {
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
            const id = path === "/" ? Object.keys(sectionNav).find((key) => sectionNav[key] === item.href) : undefined;
            return (
              <Link
                key={item.href}
                ref={index === 0 ? firstLink : undefined}
                href={id ? `#${id}` : item.href}
                aria-current={active ? "page" : undefined}
                data-active={lit === item.href || undefined}
                onClick={id ? () => setDrawer(false) : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hm-side-foot">
          <div className="hm-connect">
            <p className="hm-side-label" id="hm-connect-label">Connect</p>
            <ul className="hm-social" aria-labelledby="hm-connect-label">
              {social.map(({ href, label, Icon, external }) => (
                <li key={label}>
                  <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    <Icon aria-hidden className="hm-social-icon" />
                    {label}
                    <ArrowUpRight aria-hidden className="hm-social-go" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="hm-side-bottom">
            <Link href="/desk" className="hm-desk">Desk ↵</Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* While the drawer is open the page behind it is inert, so focus stays in the drawer. */}
      <main className="hm-main" id="main" tabIndex={-1} inert={drawer}>{children}</main>
    </div>
  );
}
