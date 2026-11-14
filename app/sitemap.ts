import type { MetadataRoute } from "next";
import { getNotes, getPosts } from "@/src/lib/content";
import { absolute } from "@/src/lib/site";

export const dynamic = "force-static";

// /desk stays out until it is part of the site.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts().filter((post) => !post.draft);
  const notes = getNotes().filter((note) => !note.draft);
  const latest = posts[0]?.date;
  return [
    { url: absolute("/"), lastModified: latest },
    { url: absolute("/work/") },
    { url: absolute("/about/") },
    { url: absolute("/blog/"), lastModified: latest },
    { url: absolute("/field-notes/"), lastModified: notes[0]?.date },
    ...posts.map((post) => ({ url: absolute(`/blog/${post.slug}/`), lastModified: post.date })),
    ...notes.map((note) => ({ url: absolute(`/field-notes/${note.slug}/`), lastModified: note.date })),
  ];
}
