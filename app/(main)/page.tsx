import { ArrowDown } from "lucide-react";
import BlogDeck from "@/src/components/home/BlogDeck";
import CopyEmail from "@/src/components/home/CopyEmail";
import { Empty, Experience, Flagship, Footer, NoteList, ProjectCards, SectionHead, email, otherProjects } from "@/src/components/home/sections";
import { formatDate, getNotes, getPosts } from "@/src/lib/content";

export default async function Home() {
  const posts = getPosts().map(({ slug, title, summary, date, minutes, tags, draft, cover }) => ({ slug, title, summary, minutes, tags, draft, cover, date: formatDate(date) }));
  const notes = getNotes().slice(0, 4);

  return (
    <>
      <div className="hm-col">
        <section className="hm-sec hm-hero" aria-labelledby="hero-title">
          <p className="hm-kicker">Product engineer · Lahore</p>
          <h1 id="hero-title">I build apps where the numbers <em>have to add&nbsp;up</em>.</h1>
          <p className="hm-bio">
            At <b>Ripeseed.io</b> I work on Brava Pro Portal, a roofing platform for contractors.
            I also build web and mobile apps for clients and myself, from payment checkouts to shared expenses.
          </p>
          <div className="hm-actions">
            <a href="#work" className="hm-btn hm-btn-primary">See my work <ArrowDown aria-hidden /></a>
            <a href="#blog" className="hm-btn">Read the blog</a>
          </div>
        </section>

        <section className="hm-sec" id="work" aria-labelledby="work-title">
          <SectionHead id="work-title" kicker="Work" title="What I built, and which part was mine" more={{ href: "/work", label: "All projects" }} />
          <Flagship />
          <ProjectCards items={otherProjects.slice(0, 3)} />
        </section>

        <section className="hm-sec" id="blog" aria-labelledby="blog-title">
          <SectionHead id="blog-title" kicker="Blog" title="The long version" more={posts.length ? { href: "/blog", label: "All posts" } : undefined} />
          {posts.length ? <BlogDeck posts={posts} /> : <Empty title="The first post is on its way.">Field notes below have the quick fixes until then.</Empty>}
        </section>

        <section className="hm-sec" id="field-notes" aria-labelledby="notes-title">
          <SectionHead id="notes-title" kicker="Field notes" title="Bugs and edge cases, one fix each" more={notes.length ? { href: "/field-notes", label: "All field notes" } : undefined} />
          <NoteList notes={notes} />
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
