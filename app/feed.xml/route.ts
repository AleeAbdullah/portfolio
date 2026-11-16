import { getNotes, getPosts } from "@/src/lib/content";
import { SITE_NAME, absolute } from "@/src/lib/site";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// One feed for both blog posts and field notes, newest first.
export function GET() {
  const entries = [
    ...getPosts().map((entry) => ({ entry, path: `/blog/${entry.slug}/` })),
    ...getNotes().map((entry) => ({ entry, path: `/field-notes/${entry.slug}/` })),
  ]
    .filter(({ entry }) => !entry.draft)
    .sort((a, b) => b.entry.date.localeCompare(a.entry.date));
  const items = entries
    .map(({ entry, path }) => {
      const url = absolute(path);
      return `<item><title>${esc(entry.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(`${entry.date}T00:00:00Z`).toUTCString()}</pubDate><description>${esc(entry.summary)}</description><content:encoded><![CDATA[${entry.html.replace(/(href|src)="\//g, `$1="${absolute("/")}`).replace(/]]>/g, "]]]]><![CDATA[>")}]]></content:encoded></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><atom:link href="${absolute("/feed.xml")}" rel="self" type="application/rss+xml"/><title>${SITE_NAME} — Blog and field notes</title><link>${absolute("/")}</link><description>Posts and short bug write-ups on building web and mobile products.</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
