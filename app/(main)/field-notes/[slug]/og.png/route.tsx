import { getNote, getNotes } from "@/src/lib/content";
import { ogCard } from "@/src/lib/og";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => getNotes().map((note) => ({ slug: note.slug }));

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const note = getNote((await params).slug);
  return ogCard({ kicker: "Ali Abdullah · Field note", title: note?.title ?? "Field notes", footer: note?.tags.join(" · ") ?? "" });
}
