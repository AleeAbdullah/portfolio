import { getPosts } from "@/src/lib/content";
import { SITE_NAME, absolute } from "@/src/lib/site";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = getPosts()
    .filter((post) => !post.draft)
    .map((post) => {
      const url = absolute(`/blog/${post.slug}/`);
      return `<item><title>${esc(post.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate><description>${esc(post.summary)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${SITE_NAME} — Blog</title><link>${absolute("/blog/")}</link><description>Posts on building web and mobile products.</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
