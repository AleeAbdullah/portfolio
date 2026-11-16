import { getNote, getNotes, toMarkdown } from "@/src/lib/content";
import { absolute } from "@/src/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => getNotes().filter((note) => !note.draft).map((note) => ({ slug: note.slug }));

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const note = getNote((await params).slug)!;
  return new Response(toMarkdown(note, absolute(`/field-notes/${note.slug}/`), false), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
