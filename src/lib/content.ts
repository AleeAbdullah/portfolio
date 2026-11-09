import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

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

// Minimal frontmatter: `key: value` lines between `---` fences, with `[a, b]` lists.
function parse(file: string): Entry {
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  for (const line of (match?.[1] ?? "").split("\n")) {
    const at = line.indexOf(":");
    if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  const body = match?.[2] ?? raw;
  const list = (value = "") => value.replace(/^\[|\]$/g, "").split(",").map((item) => item.trim()).filter(Boolean);
  return {
    slug: path.basename(file, ".md"),
    title: meta.title ?? path.basename(file, ".md"),
    date: meta.date ?? "",
    summary: meta.summary ?? "",
    tags: list(meta.tags),
    draft: meta.draft === "true",
    cover: meta.cover ?? "",
    minutes: Math.max(1, Math.round(body.split(/\s+/).length / 220)),
    html: marked.parse(body, { async: false }) as string,
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

export function formatDate(date: string, style: "short" | "long" = "short") {
  if (!date) return "";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", style === "short" ? { month: "short", year: "numeric", timeZone: "UTC" } : { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
