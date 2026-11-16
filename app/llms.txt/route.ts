import { getNotes, getPosts } from "@/src/lib/content";
import { email, experiences, projects, skillGroups } from "@/src/lib/portfolioData";
import { SAME_AS, SITE_DESCRIPTION, SITE_NAME, absolute } from "@/src/lib/site";

export const dynamic = "force-static";

// llms.txt (llmstxt.org): a Markdown map of the site for AI agents, with links to plain Markdown copies of each post.
export function GET() {
  const entry = (kind: string) => (e: { slug: string; title: string; summary: string }) => `- [${e.title}](${absolute(`/${kind}/${e.slug}/`)}) ([Markdown](${absolute(`/${kind}/${e.slug}/index.md`)})): ${e.summary}`;
  const section = (title: string, lines: string[]) => [`## ${title}`, ...lines].join("\n");
  const text = [
    `# ${SITE_NAME}`,
    `> ${SITE_DESCRIPTION}`,
    `Contact: ${email}. Profiles: ${SAME_AS.join(", ")}.`,
    section("Pages", [
      `- [Home](${absolute("/")}): who Ali is, selected work, latest writing`,
      `- [Work](${absolute("/work/")}): every project, with Ali's part in each`,
      `- [About](${absolute("/about/")}): background, habits and skills`,
      `- [Blog](${absolute("/blog/")}) and [RSS feed](${absolute("/feed.xml")})`,
      `- [Field notes](${absolute("/field-notes/")}): short bug write-ups, problem, cause and fix`,
    ]),
    section("Experience", experiences.map((x) => `- ${x.role}, ${x.company} (${x.period}): ${x.description}`)),
    section("Projects", projects.map((p) => `- ${p.title} (${p.kind}; ${p.techStack.join(", ")}): ${p.description}${p.live ? ` Live: ${p.live}` : ""}`)),
    section("Skills", skillGroups.map((g) => `- ${g.title}: ${g.skills.join(", ")}`)),
    section("Blog", getPosts().filter((p) => !p.draft).map(entry("blog"))),
    section("Field notes", getNotes().filter((n) => !n.draft).map(entry("field-notes"))),
  ].join("\n\n");
  return new Response(`${text}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
