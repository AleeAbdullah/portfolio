import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import YAML from "yaml";

export type Entry = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
  cover: string;
  minutes: number;
  html: string;
};

const root = path.join(process.cwd(), "content");

// YAML frontmatter between `---` fences. Written by hand, by agents or by Pages CMS (.pages.yml),
// so lists may be `[a, b]` or `- a` lines. YAML 1.2 keeps `2026-11-02` a string; slice drops any time.
function parse(file: string): Entry {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = (match ? YAML.parse(match[1]) : null) ?? {};
  const body = match?.[2] ?? raw;
  const text = (value: unknown) => (value == null ? "" : String(value).trim());
  const html = marked.parse(body, { async: false }) as string;
  // Field notes have no summary field, so their search description is the opening text, cut at a word.
  const plain = html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
  const excerpt = plain.length > 160 ? `${plain.slice(0, 157).replace(/\s+\S*$/, "").replace(/[.,;:]+$/, "")}…` : plain;
  return {
    slug: path.basename(file, ".md"),
    title: text(meta.title) || path.basename(file, ".md"),
    date: text(meta.date).slice(0, 10),
    summary: text(meta.summary) || excerpt,
    tags: (Array.isArray(meta.tags) ? meta.tags : []).map(text).filter(Boolean),
    draft: meta.draft === true || meta.draft === "true",
    cover: text(meta.cover),
    minutes: Math.max(1, Math.round(body.split(/\s+/).length / 220)),
    html,
  };
}

function read(folder: "blog" | "field-notes"): Entry[] {
  const dir = path.join(root, folder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => parse(path.join(dir, name)))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const getPosts = () => read("blog");
export const getNotes = () => read("field-notes");
export const getPost = (slug: string) => getPosts().find((post) => post.slug === slug);
export const getNote = (slug: string) => getNotes().find((note) => note.slug === slug);

export function formatDate(date: string, style: "short" | "long" = "short") {
  if (!date) return "";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", style === "short" ? { month: "short", year: "numeric", timeZone: "UTC" } : { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
