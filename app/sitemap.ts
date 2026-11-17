import type { MetadataRoute } from "next";
import { getNotes, getPosts } from "@/src/lib/content";
import { absolute } from "@/src/lib/site";

export const dynamic = "force-static";

// /desk stays out until it is part of the site.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts().filter((post) => !post.draft);
  const notes = getNotes().filter((note) => !note.draft);
  return [
    // Listing pages carry no date: they change whenever any entry does, and a wrong lastmod is worse than none.
    { url: absolute("/") },
    { url: absolute("/work/") },
    { url: absolute("/about/") },
    { url: absolute("/blog/") },
    { url: absolute("/field-notes/") },
    ...posts.map((post) => ({ url: absolute(`/blog/${post.slug}/`), lastModified: post.updated || post.date })),
    ...notes.map((note) => ({ url: absolute(`/field-notes/${note.slug}/`), lastModified: note.updated || note.date })),
  ];
}
