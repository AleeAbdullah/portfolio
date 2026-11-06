"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowUpRight, FileText, Folder, Github, Mail, Monitor, Moon, Sun } from "lucide-react";
import { experiences, projects, skillGroups, type PortfolioProject } from "@/src/lib/portfolioData";
import DesktopWindow from "./DesktopWindow";
import RoofingExplainer from "./RoofingExplainer";
import type { ApplicationId, DesktopAction, DesktopState } from "./desktopState";
import type { ScreenTheme } from "./screenTheme";
export type { ScreenPage } from "./desktopState";

export type ScreenProps = {
  desktop: DesktopState;
  dispatch: (action: DesktopAction) => void;
  theme: ScreenTheme;
  onTheme: (theme: ScreenTheme) => void;
  onLeave: () => void;
  interactive: boolean;
};

const applications = [
  { id: "projects", title: "Projects", icon: Folder },
  { id: "experience", title: "Experience", icon: Folder },
  { id: "skills", title: "Skills", icon: Folder },
  { id: "about", title: "About me.txt", icon: FileText },
  { id: "contact", title: "Contact", icon: Mail },
] as const;

export default function WorkstationScreen({ desktop, dispatch, theme, onTheme, onLeave, interactive }: ScreenProps) {
  const screen = useRef<HTMLDivElement>(null);
  const lastActive = useRef<ApplicationId | null>(null);
  const activeWindow = desktop.windows.find((window) => window.id === desktop.active);
  const windowVisible = desktop.windows.some((window) => !window.minimized);
  const activeProject = activeWindow?.project;
  const windowVisibility = desktop.windows.map((window) => `${window.id}:${window.minimized}`).join("|");

  function onPage(id: ApplicationId) { dispatch({ type: "open", id }); }
  function onProject(project: number | null) { dispatch({ type: "project", project }); }

  useEffect(() => {
    if (!interactive) return;
    let target: HTMLElement | null | undefined;
    if (desktop.active) {
      const window = screen.current?.querySelector<HTMLElement>(`[data-window="${desktop.active}"]`);
      if (!window?.contains(document.activeElement)) target = window?.querySelector<HTMLElement>(".computer-content");
      lastActive.current = desktop.active;
    } else {
      const previous = lastActive.current;
      target = screen.current?.querySelector<HTMLElement>(`[data-taskbar="${previous}"]`) ?? screen.current?.querySelector<HTMLElement>(`[data-folder="${previous}"]`) ?? screen.current?.querySelector<HTMLElement>(".computer-desktop");
    }
    target?.focus({ preventScroll: true });
  }, [desktop.active, activeProject, interactive, windowVisibility]);

  return (
    <div ref={screen} className="computer-screen" data-theme={theme} data-testid="computer-screen" aria-label="Ali's portfolio computer" inert={!interactive} aria-hidden={!interactive} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
      <div className="computer-titlebar"><span className="computer-system-title"><Monitor size={15} /><span>ali / personal computer</span></span><div className="computer-titlebar-actions"><div className="computer-theme-switch" role="group" aria-label="Screen appearance"><button aria-label="Light screen theme" aria-pressed={theme === "light"} onClick={() => onTheme("light")}><Sun size={12} /><span>Light</span></button><button aria-label="Dark screen theme" aria-pressed={theme === "dark"} onClick={() => onTheme("dark")}><Moon size={12} /><span>Dark</span></button></div><button className="computer-exit" onClick={onLeave} aria-label="Step back from computer" title="Step back"><ArrowUpRight size={17} /></button></div></div>
      <div className="computer-desktop" data-window-open={windowVisible} data-maximized={desktop.windows.some((window) => window.maximized && !window.minimized)} tabIndex={-1} aria-label="Portfolio desktop">
        <nav className="computer-desktop-icons" aria-label="Desktop folders and files">
          {applications.map(({ id, title, icon: Icon }) => <button key={id} data-folder={id} className={`computer-desktop-icon ${id === "about" || id === "contact" ? "computer-document-icon" : ""}`} onClick={() => onPage(id)} aria-label={`Open ${title}${id === "about" || id === "contact" ? "" : " folder"}`} aria-haspopup="dialog" aria-expanded={desktop.windows.some((window) => window.id === id && !window.minimized)}><Icon size={50} strokeWidth={1.2} /><span>{title}</span></button>)}
        </nav>
        <div className="computer-desktop-signature" aria-hidden={windowVisible}><span className="computer-kicker">A little space for my work.</span><h1>Ali Abdullah.</h1><p>Full stack developer / web & mobile</p><span className="computer-desktop-hint">Click a folder to take a look around.</span></div>
        {applications.map((application) => {
          const window = desktop.windows.find((item) => item.id === application.id);
          if (!window) return null;
          const index = desktop.windows.indexOf(window);
          const page = window.id;
          const project = window.project;
          const selected = project === null ? null : projects[project];
          const title = application.title;
          const status = page === "projects" ? `${selected ? "1 selected" : `${projects.length} items`} · web & mobile` : page === "experience" ? `${experiences.length} roles · 1 education` : page === "skills" ? `${skillGroups.length} groups` : "Personal files";
          return <DesktopWindow key={page} window={window} title={title} active={desktop.active === page} zIndex={index + 2} dispatch={dispatch} status={status}>
            <section key={`${page}-${project}`} className="computer-content" tabIndex={interactive ? 0 : -1} aria-label={`${page} content`}>
            {page === "projects" && (selected ? <article className="computer-project-detail">
              <button className="computer-link" onClick={() => onProject(null)}><ArrowLeft size={16} /> All projects</button>
              <span className="computer-kicker">{selected.category === "app" ? "Mobile application" : "Web platform"} / {selected.tier === "main" ? "Main project" : "Supporting project"}</span>
              <h2>{selected.title}</h2>
              <div className="computer-detail-image"><ProjectCover project={selected} /></div>
              <p>{selected.description}</p>
              {selected.overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {selected.explainer === "roofing-proposal" && <RoofingExplainer theme={theme} />}
              <ul className="computer-tags">{selected.techStack.map((tech) => <li key={tech}>{tech}</li>)}</ul>
              <ul className="computer-features">{selected.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <div className="computer-project-actions">{selected.live && <a href={selected.live} target="_blank" rel="noopener noreferrer">Visit project <ArrowUpRight size={17} /></a>}{selected.github && <a href={selected.github} target="_blank" rel="noopener noreferrer">View source <Github size={17} /></a>}</div>
            </article> : <section>
              <span className="computer-kicker">Selected web & mobile work</span><h2>Projects.</h2>
              {(["main", "supporting"] as const).map((tier) => <section className="computer-project-group" key={tier}>
                <h3>{tier === "main" ? "Main projects" : "Supporting projects"}</h3>
                <div className="computer-project-grid">{projects.map((item, index) => item.tier === tier && <button key={item.title} className="computer-project-file" onClick={() => onProject(index)}>
                  <div><ProjectCover project={item} /></div>
                  <span className="computer-kicker">{item.category === "app" ? "Mobile application" : "Web platform"}</span><strong>{item.title}</strong><span>Open project <ArrowUpRight size={14} /></span>
                </button>)}</div>
              </section>)}
            </section>)}

            {page === "experience" && <section><span className="computer-kicker">Work history / 2021 — present</span><h2>Experience.</h2><div className="computer-timeline">{experiences.map((job) => <article key={job.company}><span className="computer-kicker">{job.period}</span><h3>{job.company}</h3><span className="computer-job-role">{job.role} · {job.location}</span><p>{job.description}</p></article>)}<article><span className="computer-kicker">2018 — 2022 / Education</span><h3>FAST-NUCES, Lahore</h3><p>BS Computer Science</p></article></div></section>}
            {page === "skills" && <section><span className="computer-kicker">The tools behind the work</span><h2>Skills.</h2><p>Picked for the problem, from interface to database.</p><div className="computer-skill-groups">{skillGroups.map((group) => <article key={group.title}><h3>{group.title}</h3><ul className="computer-tags">{group.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></article>)}</div></section>}
            {page === "about" && <section className="computer-reading"><span className="computer-kicker">A little introduction</span><h2>Hi, I&apos;m Ali.</h2><p>I&apos;m a full stack developer working across the web and mobile. I build interfaces with React, Next.js, and React Native, and connect them to APIs and databases.</p><p>My work spans restaurant platforms, marketplaces, learning applications, and tools that help people get things done.</p><p>This desk is a home for that work. Open a folder, take a look around, or get in touch.</p><button className="computer-link" onClick={() => onPage("contact")}>Let&apos;s talk <ArrowUpRight size={17} /></button></section>}
            {page === "contact" && <section className="computer-reading"><span className="computer-kicker">The start of a conversation</span><h2>Say hello.</h2><p>Have a project in mind? I&apos;d like to hear about it.</p><a className="computer-email" href="mailto:ali.37803990@gmail.com">ali.37803990@gmail.com <ArrowUpRight size={20} /></a><div className="computer-project-actions"><a href="https://github.com/AleeAbdullah" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={16} /></a><a href="https://www.linkedin.com/in/ali-abdullah-854716224" target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={16} /></a></div></section>}
            </section>
          </DesktopWindow>;
        })}
      </div>
      <div className="computer-taskbar">
        <button className="computer-desktop-button" onClick={() => dispatch({ type: "showDesktop" })} aria-label="Show desktop" title="Show desktop"><Monitor size={14} /><span>Desktop</span></button>
        <div className="computer-taskbar-windows" aria-label="Open windows">{applications.map(({ id, title, icon: Icon }) => {
          const window = desktop.windows.find((item) => item.id === id);
          if (!window) return null;
          const active = desktop.active === id;
          return <button key={id} data-taskbar={id} className="computer-taskbar-window" onClick={() => dispatch({ type: active ? "minimize" : "open", id })} aria-label={`${active ? "Minimize" : window.minimized ? "Restore" : "Activate"} ${title} window`} aria-pressed={active}><Icon size={13} /><span>{title}</span></button>;
        })}</div>
        {desktop.windows.length === 0 && <span className="computer-taskbar-status"><span className="computer-status-dot" /> Portfolio / Ali Abdullah</span>}
      </div>
    </div>
  );
}

function ProjectCover({ project }: { project: PortfolioProject }) {
  return project.images[0] ? <Image src={project.images[0]} alt={`${project.title} preview`} width={700} height={440} sizes="600px" /> : <div className="computer-project-cover" aria-hidden="true"><FileText size={38} strokeWidth={1.1} /><span>PROJECT FILE</span><strong>{project.title}</strong><small>{project.techStack.slice(0, 2).join(" / ")}</small></div>;
}
