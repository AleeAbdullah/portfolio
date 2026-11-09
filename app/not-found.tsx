import Link from "next/link";
import Shell from "@/src/components/home/Shell";
import { Footer } from "@/src/components/home/sections";
import { getActivity } from "@/src/lib/github";

// Unknown URLs get the site's own shell instead of Next's unstyled default.
export default async function NotFound() {
  return (
    <Shell activity={await getActivity()}>
      <div className="hm-col" style={{ gap: 32 }}>
        <header className="hm-page-head">
          <p className="hm-kicker">404</p>
          <h1>Nothing lives at this address.</h1>
          <p>The link may be old, or the post may have moved.</p>
        </header>
        <div className="hm-actions">
          <Link href="/" className="hm-btn hm-btn-primary">Go home</Link>
          <Link href="/blog" className="hm-btn">Blog</Link>
          <Link href="/field-notes" className="hm-btn">Field notes</Link>
        </div>
      </div>
      <Footer />
    </Shell>
  );
}
