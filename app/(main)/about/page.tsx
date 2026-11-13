import type { Metadata } from "next";
import CopyEmail from "@/src/components/home/CopyEmail";
import { Bio, Footer, SectionHead, email } from "@/src/components/home/sections";
import { skillGroups } from "@/src/lib/portfolioData";

export const metadata: Metadata = { title: "About — Ali Abdullah", description: "Ali Abdullah is a software engineer in Lahore. Freelancing since 2021, now building roofing quote tools at Ripeseed.io." };

// Habits, each backed by a project on the site.
const habits = [
  { where: "FitKraft", title: "Make it work without a signal first.", body: "FitKraft logs every set and meal to SQLite on the phone, and syncs with the server when it can." },
  { where: "Field notes", title: "Leave a note when a bug costs me an hour.", body: "If a fix took me an hour to find, the field note should take the next person a minute to read: the problem, the cause, the fix." },
];

export default function About() {
  return (
    <>
      <div className="hm-col" style={{ gap: 80 }}>
        <header className="hm-page-head">
          <p className="hm-kicker">About</p>
          <h1>I started with Upwork clients in 2021. Now I build roofing software.</h1>
          <div className="hm-prose" style={{ fontSize: 16 }}>
            <Bio />
          </div>
        </header>

        <section className="hm-sec" aria-labelledby="about-habits">
          <SectionHead id="about-habits" kicker="Habits" title="How I build" />
          <ul className="hm-exp">
            {habits.map((habit) => (
              <li key={habit.title}>
                <span className="hm-meta">{habit.where}</span>
                <div>
                  <h3>{habit.title}</h3>
                  <p>{habit.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="hm-sec" aria-labelledby="about-stack">
          <SectionHead id="about-stack" kicker="Stack" title="TypeScript up front, Django or NestJS behind it" />
          <div className="hm-skills">
            {skillGroups.map((group) => (
              <div key={group.title}>
                <h3>{group.title}</h3>
                <div className="hm-tags">{group.skills.map((skill) => <span key={skill} className="hm-tag">{skill}</span>)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="hm-sec hm-contact" aria-labelledby="about-contact">
          <p className="hm-kicker">Contact</p>
          <h2 id="about-contact">Email works best.</h2>
          <p className="hm-bio">Hiring for a frontend or full-stack role, building something that&apos;s stuck, or curious about a post? Send me a line.</p>
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
