"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { experiences, projects, skillGroups, type PortfolioProject } from "@/src/lib/portfolioData";
import { AgentSwarm, BuildHud, BuildInvite, BuildSwitch } from "./AgentSwarm";
import { BuildSection, CardTitle, TypeText } from "./BuildSection";
import { BuildProvider, useBuild } from "./buildMode";
import "./site.css";

const email = "ali.37803990@gmail.com";
const [flagship, ...otherProjects] = projects;
const toolCount = skillGroups.reduce((sum, group) => sum + group.skills.length, 0);
const nav = [["about", "About"], ["work", "Work"], ["experience", "Experience"], ["stack", "Stack"], ["contact", "Contact"]] as const;

export default function SitePage() {
  return (
    <BuildProvider>
      <Site />
    </BuildProvider>
  );
}

function Site() {
  const { root } = useBuild();
  return (
    <div ref={root} className="site">
      <header className="s-nav">
        <a href="#hero" className="s-logo"><b>AA</b>ALI.</a>
        <nav aria-label="Sections">{nav.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
        <div className="s-nav-end"><BuildSwitch /><Link href="/desk" className="s-desk">Enter the desk ↵</Link></div>
      </header>

      {/* Before <main> so the Skip button is an early tab stop; it is positioned fixed. */}
      <BuildHud />

      <main>
        <BuildSection id="hero" number="01" label="Hero" data={`data ▸ profile · ${experiences[0].company} · ${experiences[0].location}`} className="s-hero">
          <TypeText as="div" className="s-hero-word" text="BUILDER" name="BUILDER wordmark" decorative />
          <div className="s-wrap s-hero-grid">
            <div>
              <p className="s-hello" data-build="text">Hello, I&apos;m</p>
              <TypeText as="h1" className="s-name" text="ALI ABDULLAH." />
              <p className="s-role" data-build="text" data-name="role tag">Software engineer · web &amp; mobile</p>
              <p className="s-lede" data-build="text">I build contractor platforms, finance apps and offline-first mobile tools, <em>from the database to the last pixel.</em></p>
              <div className="s-actions" data-build="block" data-name="hero actions"><BuildInvite /><a href="#work" className="s-btn">View work →</a></div>
            </div>
            <dl className="s-spec" data-build="block" data-name="profile">
              <div><dt>Now</dt><dd>{experiences[0].role}, {experiences[0].company}</dd></div>
              <div><dt>Before</dt><dd>{experiences.slice(1).map((job) => job.company).join(" · ")}</dd></div>
              <div><dt>Shipping since</dt><dd>2021</dd></div>
              <div><dt>Based</dt><dd>{experiences[0].location}</dd></div>
              <div><dt>Stack</dt><dd>Next.js · Django · React Native</dd></div>
            </dl>
          </div>
        </BuildSection>

        <BuildSection id="about" number="02" label="About" data="data ▸ 2 paragraphs · 3 facts" className="s-section">
          <div className="s-wrap s-about">
            <div>
              <p className="s-label" data-build="text">02 — About</p>
              <TypeText className="s-h2" text="Product-minded, end to end." />
            </div>
            <div className="s-about-body">
              <p data-build="text">I&apos;m a full stack developer working across the web and mobile. I build interfaces with React, Next.js and React Native, and connect them to APIs and databases in Django, NestJS and Node.</p>
              <p data-build="text">My work spans contractor platforms, restaurant ordering, marketplaces, finance and fitness apps, and tools that help people get things done.</p>
              <ul className="s-facts">
                <li data-build="card" data-name="fact: projects"><CardTitle as="b" text="15+" /><span data-slot="body">projects shipped</span></li>
                <li data-build="card" data-name="fact: years"><CardTitle as="b" text="5 yrs" /><span data-slot="body">building for clients since 2021</span></li>
                <li data-build="card" data-name="fact: platforms"><CardTitle as="b" text="3" /><span data-slot="body">platforms: web, iOS, Android</span></li>
              </ul>
            </div>
          </div>
        </BuildSection>

        <BuildSection id="work" number="03" label="Work" data={`data ▸ loaded ${projects.length} projects · flagship: ${flagship.title}`} className="s-section">
          <div className="s-wrap">
            <p className="s-label" data-build="text">03 — Flagship project</p>
            <TypeText className="s-h2" text="Flagship project." />
            <article className="s-flagship">
              <div>
                <p className="s-meta" data-build="text">P/01 · {flagship.category === "app" ? "App" : "Web"}</p>
                <TypeText as="h3" className="s-h3" text={flagship.title} />
                <p className="s-copy" data-build="text">{flagship.description}</p>
                <p className="s-copy s-muted" data-build="text">{flagship.overview[1]}</p>
                <Chips items={flagship.techStack} name="flagship stack" />
              </div>
              <ol className="s-pipeline">
                {["Roof reports & measurements", "Material estimates with waste and coverage", "Supplier pricing versions", "Customer proposal as a PDF"].map((step, index) => (
                  <li key={step} data-build="card" data-name={`pipeline step ${String(index + 1).padStart(2, "0")}`}><span data-slot="meta">{String(index + 1).padStart(2, "0")}</span><CardTitle as="span" text={step} /></li>
                ))}
              </ol>
            </article>
          </div>
        </BuildSection>

        <BuildSection id="more-work" number="04" label="More work" data={`data ▸ ${otherProjects.length} more projects · portfolioData.ts`} className="s-section s-section-tight">
          <div className="s-wrap">
            <p className="s-label" data-build="text">04 — More work</p>
            <TypeText className="s-h2" text="More work." />
            <ul className="s-grid">
              {otherProjects.map((project, index) => (
                <li key={project.title} className="s-card" data-build="card">
                  <Cover project={project} />
                  <p className="s-meta" data-slot="meta">P/{String(index + 2).padStart(2, "0")} · {project.category === "app" ? "App" : "Web"}</p>
                  <CardTitle text={project.title} />
                  <p data-slot="body">{project.description}</p>
                  <Chips items={project.techStack.slice(0, 3)} slot />
                  {(project.live || project.github) && (
                    <div className="s-links" data-slot="links">
                      {project.live && <a href={project.live} target="_blank" rel="noopener noreferrer">Live ↗</a>}
                      {project.github && <a href={project.github} target="_blank" rel="noopener noreferrer">Code ↗</a>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </BuildSection>

        <BuildSection id="experience" number="05" label="Experience" data={`data ▸ loaded ${experiences.length} roles · portfolioData.ts`} className="s-section">
          <div className="s-wrap">
            <p className="s-label" data-build="text">05 — Experience</p>
            <TypeText className="s-h2" text="Where I've built." />
            <ol className="s-jobs">
              {experiences.map((job) => (
                <li key={job.company} data-build="card">
                  <span className="s-meta" data-slot="meta">{job.period}</span>
                  <div><CardTitle text={job.company} /><p className="s-meta" data-slot="meta">{job.role} · {job.location}</p></div>
                  <p data-slot="body">{job.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </BuildSection>

        <BuildSection id="stack" number="06" label="Stack" data={`data ▸ ${toolCount} tools in ${skillGroups.length} groups`} className="s-section">
          <div className="s-wrap">
            <p className="s-label" data-build="text">06 — Stack</p>
            <TypeText className="s-h2" text="Tools I reach for." />
            <div className="s-stack">
              {skillGroups.map((group) => (
                <div key={group.title} className="s-stack-group" data-build="card">
                  <CardTitle text={group.title} />
                  <Chips items={group.skills} slot />
                </div>
              ))}
            </div>
          </div>
        </BuildSection>

        <BuildSection id="contact" number="07" label="Contact" data="data ▸ email · GitHub · LinkedIn" className="s-section s-contact">
          <div className="s-wrap">
            <p className="s-label" data-build="text">07 — Contact</p>
            <TypeText className="s-h2 s-h2-xl" text="Let's build something." />
            <p className="s-lede" data-build="text">Have a project in mind? I&apos;d like to hear about it.</p>
            <div className="s-contact-row" data-build="block" data-name="email">
              <a className="s-email" href={`mailto:${email}`}>{email}</a>
              <CopyEmail />
            </div>
            <div className="s-links s-contact-links" data-build="block" data-name="social links">
              <a href="https://github.com/AleeAbdullah" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
              <a href="https://www.linkedin.com/in/ali-abdullah-854716224" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            </div>
          </div>
        </BuildSection>
      </main>

      <footer className="s-footer s-wrap">
        <span>© {new Date().getFullYear()} Ali Abdullah</span>
        <span>Designed and built by Ali, piece by piece.</span>
        <Link href="/desk">Enter the desk ↵</Link>
      </footer>

      <AgentSwarm />
    </div>
  );
}

// Standalone chip lists are their own component; inside a card they are the card's chips slot.
function Chips({ items, slot = false, name }: { items: string[]; slot?: boolean; name?: string }) {
  const mark = slot ? { "data-slot": "chips" } : { "data-build": "chips", "data-name": name };
  return (
    <ul className="s-chips" {...mark} style={{ "--count": items.length } as CSSProperties}>
      {items.map((item, index) => <li key={item} style={{ "--n": index } as CSSProperties}>{item}</li>)}
    </ul>
  );
}

// Same 16:9 box for every card: the first screenshot if there is one, else the headline feature
// on an Ember grid (the title, index and stack are already right below it).
function Cover({ project }: { project: PortfolioProject }) {
  const image = project.images[0];
  return (
    <div className={image ? "s-cover is-photo" : "s-cover"} data-slot="cover">
      {image ? (
        <Image src={encodeURI(image)} alt={`${project.title} preview`} fill sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 400px" />
      ) : (
        <div className="s-cover-type" aria-hidden="true">
          <b>{project.features[0]}</b>
        </div>
      )}
    </div>
  );
}

function CopyEmail() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* The mailto link still works. */ }
  }
  return <button className="s-btn s-btn-primary" onClick={copy}>{copied ? "Copied ✓" : "Copy email"}</button>;
}
