import type { Metadata } from "next";
import Link from "next/link";
import { Footer, NoteList } from "@/src/components/home/sections";
import { getNotes } from "@/src/lib/content";

export const metadata: Metadata = { title: "Field notes — Ali Abdullah", description: "Short notes from Ali Abdullah on bugs and edge cases from real projects: the problem, the cause, the fix." };

export default function FieldNotes() {
  return (
    <>
      <div className="hm-col" style={{ gap: 56 }}>
        <header className="hm-page-head">
          <p className="hm-kicker">Field notes</p>
          <h1>Bugs and edge cases, one fix each</h1>
          <p>Each note is a minute long: the problem, the cause, the fix. Longer stories live on the <Link href="/blog" className="hm-inline">blog</Link>.</p>
        </header>
        <NoteList notes={getNotes()} level={2} />
      </div>
      <Footer />
    </>
  );
}
