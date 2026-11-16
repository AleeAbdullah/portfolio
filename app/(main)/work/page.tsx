import type { Metadata } from "next";
import { FEED_ALTERNATE } from "@/src/lib/site";
import { Flagship, Footer, ProjectList, otherProjects } from "@/src/components/home/sections";

export const metadata: Metadata = {
  title: "Work — Ali Abdullah",
  description: "Web and mobile products Ali Abdullah has worked on, from Brava Pro Portal, a roofing platform, to an offline-first training log, with his part in each.",
  alternates: { canonical: "/work/", types: FEED_ALTERNATE },
};

export default function Work() {
  return (
    <>
      <div className="hm-col" style={{ gap: 56 }}>
        <header className="hm-page-head">
          <p className="hm-kicker">Work</p>
          <h1>What I built, and which part was mine</h1>
          <p>Brava Pro Portal is team work at Ripeseed.io. I work mostly on the frontend, and built the proposal editor and its backend calculations. The rest are my builds, for clients or for myself, usually from the interface down to the database. Open one to see what was hard and how I handled it.</p>
        </header>
        <Flagship level={2} />
        <ProjectList items={otherProjects} level={2} />
      </div>
      <Footer />
    </>
  );
}
