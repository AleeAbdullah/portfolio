import { ArrowDown } from "lucide-react";
import BlogDeck from "@/src/components/home/BlogDeck";
import CopyEmail from "@/src/components/home/CopyEmail";
import NowPanel from "@/src/components/home/NowPanel";
import { Empty, Experience, Flagship, Footer, NoteList, ProjectCards, ProjectList, SectionHead, email, otherProjects } from "@/src/components/home/sections";
import { formatDate, getNotes, getPosts } from "@/src/lib/content";
import { getActivity } from "@/src/lib/github";

export default async function Home() {
  const activity = await getActivity();
  const posts = getPosts().map(({ slug, title, summary, date, minutes, tags, draft, cover }) => ({ slug, title, summary, minutes, tags, draft, cover, date: formatDate(date) }));
  const notes = getNotes().slice(0, 4);
  const nums = (
    <ul className="hm-nums">
      <li><b>{new Date().getFullYear() - 2021}<small>yrs</small></b><span>Building for paying clients since 2021</span></li>
      <li><b>1,900+</b><span>My commits to the roofing platform since Aug 2025</span></li>
      <li><b>{activity.total.toLocaleString("en-US")}</b><span>GitHub contributions in the last year</span></li>
    </ul>
  );

  return (
    <>
      <div className="hm-col">
        <section className="hm-sec hm-hero" aria-labelledby="hero-title">
          <p className="hm-kicker">Software engineer · Lahore</p>
          <h1 id="hero-title">I build apps where the numbers <em>have to add&nbsp;up</em>.</h1>
          <p className="hm-bio">
            At <b>Ripeseed.io</b> that means roofing: our team&apos;s platform turns roof measurements into material estimates and a priced
            proposal, and my part is the proposal builder. Before that I built restaurant ordering at Tech Grus, and spent three years on client
            apps through Upwork. On my own time it&apos;s Tally Stick, a shared-expenses app that splits bills to the cent.
          </p>
          <div className="hm-actions">
            <a href="#work" className="hm-btn hm-btn-primary">See my work <ArrowDown aria-hidden /></a>
            <a href="#blog" className="hm-btn">Read the blog</a>
          </div>
          {nums}
          {/* Phones have no sidebar, so the live Now panel joins the hero and carries the numbers. */}
          <div className="hm-hero-now"><NowPanel activity={activity}>{nums}</NowPanel></div>
        </section>

        <section className="hm-sec" id="blog" aria-labelledby="blog-title">
          <SectionHead id="blog-title" kicker="Blog" title="The long version" more={posts.length ? { href: "/blog", label: "All posts" } : undefined} />
          {posts.length ? <BlogDeck posts={posts} /> : <Empty title="The first post is on its way.">Field notes below have the quick fixes until then.</Empty>}
        </section>

        <section className="hm-sec" id="field-notes" aria-labelledby="notes-title">
          <SectionHead id="notes-title" kicker="Field notes" title="Bugs and edge cases, one fix each" more={notes.length ? { href: "/field-notes", label: "All field notes" } : undefined} />
          <NoteList notes={notes} />
        </section>

        <section className="hm-sec" id="work" aria-labelledby="work-title">
          <SectionHead id="work-title" kicker="Work" title="What I built, and which part was mine" more={{ href: "/work", label: "All projects" }} />
          <Flagship />
          <div className="hm-work-rows"><ProjectList items={otherProjects.slice(0, 3)} /></div>
          <ProjectCards items={otherProjects.slice(0, 3)} />
        </section>

        <section className="hm-sec" id="experience" aria-labelledby="experience-title">
          <SectionHead id="experience-title" kicker="Experience" title="From client apps to roofing software" />
          <Experience />
        </section>

        <section className="hm-sec hm-contact" id="contact" aria-labelledby="contact-title">
          <p className="hm-kicker">Contact</p>
          <h2 id="contact-title">Hiring, or stuck on a build?</h2>
          <p className="hm-bio">If you&apos;re hiring for a frontend or full-stack role, or you have a product that&apos;s stuck, email me. Questions about a post or a field note are welcome too.</p>
          <div className="hm-mail-row">
            <a className="hm-mail" href={`mailto:${email}`}>{email}</a>
            <CopyEmail email={email} />
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
