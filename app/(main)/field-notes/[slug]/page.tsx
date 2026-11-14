import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/src/components/home/sections";
import { formatDate, getNote, getNotes } from "@/src/lib/content";
import { SITE_NAME, SITE_URL, absolute } from "@/src/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => getNotes().map((note) => ({ slug: note.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const note = getNote((await params).slug);
  if (!note) return {};
  const path = `/field-notes/${note.slug}/`;
  return {
    title: `${note.title} — Ali Abdullah`,
    description: note.summary,
    alternates: { canonical: path },
    openGraph: { type: "article", url: path, title: note.title, description: note.summary, publishedTime: note.date, authors: [SITE_NAME], tags: note.tags, images: [{ url: `${path}og.png`, width: 1200, height: 630, alt: note.title }] },
    twitter: { card: "summary_large_image", images: [`${path}og.png`] },
    ...(note.draft && { robots: { index: false } }),
  };
}

export default async function Note({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const notes = getNotes();
  const at = notes.findIndex((note) => note.slug === slug);
  const note = notes[at];
  if (!note) notFound();
  const newer = notes[at - 1], older = notes[at + 1];
  const url = absolute(`/field-notes/${note.slug}/`);
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: note.title,
    description: note.summary,
    datePublished: note.date,
    url,
    image: `${url}og.png`,
    keywords: note.tags.join(", "),
    author: { "@id": `${SITE_URL}/#person` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <article className="hm-article">
        <Link href="/field-notes" className="hm-back">← All field notes</Link>
        <header style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="hm-article-meta">
            <span className="hm-meta">Field note · {formatDate(note.date, "long")}</span>
            <div className="hm-tags">{note.tags.map((tag) => <span key={tag} className="hm-tag">{tag}</span>)}</div>
          </div>
          <h1>{note.title}</h1>
        </header>
        {note.draft && <p className="hm-notice">Draft. I&apos;m still editing this one, so details may change.</p>}
        <div className="hm-prose" dangerouslySetInnerHTML={{ __html: note.html }} />
        {(newer || older) && (
          <nav className="hm-pager" aria-label="More field notes">
            {older && <Link href={`/field-notes/${older.slug}`}><span className="hm-meta">← Older</span><b>{older.title}</b></Link>}
            {newer && <Link href={`/field-notes/${newer.slug}`} className="hm-pager-next"><span className="hm-meta">Newer →</span><b>{newer.title}</b></Link>}
          </nav>
        )}
      </article>
      <Footer />
    </>
  );
}
