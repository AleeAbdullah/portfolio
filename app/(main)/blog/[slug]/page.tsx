import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/src/components/home/sections";
import { formatDate, getPost, getPosts } from "@/src/lib/content";
import { SITE_NAME, SITE_URL, absolute } from "@/src/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => getPosts().map((post) => ({ slug: post.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const path = `/blog/${post.slug}/`;
  return {
    title: `${post.title} — Ali Abdullah`,
    description: post.summary,
    alternates: { canonical: path },
    openGraph: { type: "article", url: path, title: post.title, description: post.summary, publishedTime: post.date, authors: [SITE_NAME], tags: post.tags, images: [{ url: `${path}og.png`, width: 1200, height: 630, alt: post.title }] },
    twitter: { card: "summary_large_image", images: [`${path}og.png`] },
    ...(post.draft && { robots: { index: false } }),
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = getPosts();
  const at = posts.findIndex((post) => post.slug === slug);
  const post = posts[at];
  if (!post) notFound();
  const newer = posts[at - 1], older = posts[at + 1];
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    url: absolute(`/blog/${post.slug}/`),
    image: absolute(`/blog/${post.slug}/og.png`),
    keywords: post.tags.join(", "),
    author: { "@id": `${SITE_URL}/#person` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <article className="hm-article">
        <Link href="/blog" className="hm-back">← All posts</Link>
        <header style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="hm-article-meta">
            <span className="hm-meta">{formatDate(post.date, "long")} · {post.minutes} min read</span>
            <div className="hm-tags">{post.tags.map((tag) => <span key={tag} className="hm-tag">{tag}</span>)}</div>
          </div>
          <h1>{post.title}</h1>
        </header>
        {post.draft && <p className="hm-notice">Draft. I&apos;m still editing this one, so details may change.</p>}
        <div className="hm-prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        {(newer || older) && (
          <nav className="hm-pager" aria-label="More posts">
            {older && <Link href={`/blog/${older.slug}`}><span className="hm-meta">← Older</span><b>{older.title}</b></Link>}
            {newer && <Link href={`/blog/${newer.slug}`} className="hm-pager-next"><span className="hm-meta">Newer →</span><b>{newer.title}</b></Link>}
          </nav>
        )}
      </article>
      <Footer />
    </>
  );
}
