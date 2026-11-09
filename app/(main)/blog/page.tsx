import type { Metadata } from "next";
import Link from "next/link";
import { Empty, Footer } from "@/src/components/home/sections";
import { formatDate, getPosts } from "@/src/lib/content";

export const metadata: Metadata = { title: "Blog — Ali Abdullah", description: "Posts on building web and mobile products: data, realtime, shipping and the lessons behind them." };

export default function BlogIndex() {
  const posts = getPosts();
  return (
    <>
      <div className="hm-col" style={{ gap: 56 }}>
        <header className="hm-page-head">
          <p className="hm-kicker">Blog</p>
          <h1>The long version</h1>
          <p>One project per post: what I was building, the decision that mattered, and the approach I threw away. For one-bug fixes, see <Link href="/field-notes" className="hm-inline">field notes</Link>.</p>
        </header>
        {posts.length ? (
          <div className="hm-posts">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="hm-post">
                <span className="hm-meta">{formatDate(post.date)}<br />{post.minutes} min read</span>
                <div>
                  <h2>{post.title} {post.draft && <span className="hm-draft">Draft</span>}</h2>
                  <p>{post.summary}</p>
                  <div className="hm-tags">{post.tags.map((tag) => <span key={tag} className="hm-tag">{tag}</span>)}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty title="The first post is on its way.">In the meantime, <Link href="/field-notes">field notes</Link> have the quick fixes.</Empty>
        )}
      </div>
      <Footer />
    </>
  );
}
