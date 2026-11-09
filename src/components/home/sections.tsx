import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Entry } from "@/src/lib/content";
import { formatDate } from "@/src/lib/content";
import { email, experiences, projects, type PortfolioProject } from "@/src/lib/portfolioData";
import Disclosure from "./Disclosure";
import Reveal from "./Reveal";

export { email };
export const [flagship, ...otherProjects] = projects;

export function SectionHead({ id, kicker, title, more }: { id?: string; kicker: string; title: string; more?: { href: string; label: string } }) {
  return (
    <div className="hm-head">
      <div>
        <p className="hm-kicker">{kicker}</p>
        <h2 className="hm-h2" id={id}>{title}</h2>
      </div>
      {more && <Link href={more.href} className="hm-more">{more.label} →</Link>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <div className="hm-empty"><strong>{title}</strong>{children}</div>;
}

export function NoteList({ notes, openFirst = true, level = 3 }: { notes: Entry[]; openFirst?: boolean; level?: 2 | 3 }) {
  if (!notes.length) return <Empty title="No field notes yet.">Quick fixes land here as I hit them. The blog has the longer reads in the meantime.</Empty>;
  return (
    <div className="hm-list">
      {notes.map((note, index) => (
        <Disclosure
          key={note.slug}
          id={note.slug}
          defaultOpen={openFirst && index === 0}
          level={level}
          lead={<span className="hm-meta">{formatDate(note.date)}</span>}
          title={<>{note.title} {note.draft && <span className="hm-draft">Draft</span>}</>}
          tag={note.tags[0] ? <span className="hm-tag">{note.tags[0]}</span> : undefined}
        >
          <div className="hm-prose" dangerouslySetInnerHTML={{ __html: note.html }} />
        </Disclosure>
      ))}
    </div>
  );
}

// Rows show the project's screenshot when there is one, else a monogram tile.
// Two letters, so projects that share a first letter still look different (FitKraft "FK", FlowDex "FD").
function initials(title: string) {
  const words = title.split(/[\s&]+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  const caps = title.match(/[A-Z]/g) ?? [];
  if (caps.length > 1) return caps.slice(0, 2).join("");
  // One word, one capital: first letter plus the next consonant, so "Hissab" would be "HS", not a greeting.
  return (title[0] + (title.slice(1).match(/[b-df-hj-np-tv-z]/i)?.[0] ?? title[1])).toUpperCase();
}

// Anchor for a project row, so the home carousel can link straight to it on /work.
const projectId = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Thumb({ project }: { project: PortfolioProject }) {
  const image = project.images[0];
  return <span className="hm-thumb" aria-hidden>{image ? <Image src={encodeURI(image)} alt="" fill sizes="64px" /> : initials(project.title)}</span>;
}

function ProjectDetails({ project }: { project: PortfolioProject }) {
  const image = project.images[0];
  return (
    <>
      {image && <div className="hm-shot"><Image src={encodeURI(image)} alt={`${project.title} screenshot`} fill sizes="(max-width: 900px) 100vw, 620px" /></div>}
      <div className="hm-prose">{project.overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <div className="hm-tags">{project.techStack.map((tech) => <span key={tech} className="hm-tag">{tech}</span>)}</div>
      {(project.live || project.github || project.post) && (
        <div className="hm-links-row">
          {project.post && <Link href={`/blog/${project.post}`}>Read the blog post →</Link>}
          {project.live && <a href={project.live} target="_blank" rel="noopener noreferrer">Visit site ↗</a>}
          {project.github && <a href={project.github} target="_blank" rel="noopener noreferrer">Source ↗</a>}
        </div>
      )}
    </>
  );
}

export function ProjectList({ items, level = 3 }: { items: PortfolioProject[]; level?: 2 | 3 }) {
  return (
    <div className="hm-list hm-thumb-lead" style={{ ["--lead" as string]: "64px" }}>
      {items.map((project) => (
        <Disclosure
          key={project.title}
          id={projectId(project.title)}
          lead={<Thumb project={project} />}
          title={project.title}
          sub={project.description}
          tag={<span className="hm-tag">{project.kind} · {project.category === "app" ? "Mobile" : "Web"}</span>}
          level={level}
        >
          <ProjectDetails project={project} />
        </Disclosure>
      ))}
    </div>
  );
}

// Phones only (CSS): the rows become a swipe carousel of screenshot cards.
export function ProjectCards({ items }: { items: PortfolioProject[] }) {
  return (
    <ul className="hm-cards" aria-label="More projects">
      {items.map((project) => (
        <li key={project.title}>
          <Link href={`/work#${projectId(project.title)}`} className="hm-pcard">
            <span className="hm-pcard-shot" aria-hidden>
              {project.images[0] ? <Image src={encodeURI(project.images[0])} alt="" fill sizes="80vw" /> : initials(project.title)}
            </span>
            <span className="hm-pcard-title">{project.title}</span>
            <span className="hm-pcard-sub">{project.kind} · {project.category === "app" ? "Mobile" : "Web"} · {project.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Flagship({ level = 3 }: { level?: 2 | 3 }) {
  const Title = level === 2 ? "h2" : "h3";
  return (
    <article className="hm-flag">
      <div className="hm-flag-body">
        <p className="hm-meta">Ripeseed.io · Frontend and proposal backend · 2025 — now</p>
        <Title className="hm-flag-title">{flagship.title}</Title>
        <p>{flagship.description}</p>
        <ol className="hm-steps" aria-label="How a proposal is made">
          <li>Roof measurements</li><li>Material estimates</li><li>Supplier pricing</li><li>PDF proposal</li>
        </ol>
        <Reveal label="What I built"><ProjectDetails project={flagship} /></Reveal>
      </div>
      <div className="hm-doc" aria-hidden>
        <div className="hm-doc-sheet">
          <div className="hm-doc-head"><b>Sample proposal</b><span>Illustrative figures</span></div>
          {/* Made-up figures, labelled as a sample, so the sheet reads as a finished proposal rather than a loading state. */}
          {[["Shingles", "$8,640"], ["Underlayment", "$1,920"], ["Ridge cap", "$760"], ["Labor", "$6,400"]].map(([item, cost]) => <div key={item} className="hm-doc-row"><span>{item}</span><span>{cost}</span></div>)}
          <div className="hm-doc-total"><span>Total</span><b>$17,720</b></div>
          <div className="hm-doc-file">→ proposal.pdf</div>
        </div>
      </div>
    </article>
  );
}

// Short first-person bio, used on About and on the desk.
export function Bio() {
  return (
    <>
      <p>I&apos;m a software engineer in Lahore. I took my first paid project on Upwork in 2021 and spent the next three years building web and mobile apps for small businesses, usually from the first call to deployment. That&apos;s how I ended up doing both the interface and the API. I still take on client projects alongside my full-time job: since 2025 that's been a CPR instructor&apos;s course checkout, a marketplace app that pays several sellers from one Paystack checkout, and a crypto token sale checkout.</p>
      <p>In December 2024 I joined Tech Grus to build restaurant ordering in Next.js and Firebase. Since August 2025 I&apos;ve been at <strong>Ripeseed.io</strong>, on a small team building a roofing platform for Brava Roof Tile. I work mostly on the frontend, and my part is the proposal: the editor contractors use to send branded PDFs, and the code that works out its money.</p>
      <p>Outside work I build apps like Tally Stick and FitKraft, usually ones that handle money or have to keep working offline. The blog has the long version of how they work; field notes have the bugs.</p>
    </>
  );
}

export function Experience() {
  return (
    <ul className="hm-exp">
      {experiences.map((job) => (
        <li key={job.company}>
          <span className="hm-meta">{job.period}</span>
          <div>
            <h3>{job.company}</h3>
            <p>{job.role} · {job.location}</p>
            <p>{job.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className="hm-foot">
      <span>© {new Date().getFullYear()} Ali Abdullah</span>
      <Link href="/desk">Step into the 3D desk ↵</Link>
    </footer>
  );
}
