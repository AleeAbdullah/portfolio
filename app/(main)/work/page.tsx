import type { Metadata } from "next";
import { Flagship, Footer, ProjectList, otherProjects } from "@/src/components/home/sections";

export const metadata: Metadata = { title: "Work — Ali Abdullah", description: "Web and mobile products Ali Abdullah has built, from roofing proposals to an offline-first training log, with his part in each." };

export default function Work() {
  return (
    <>
      <div className="hm-col" style={{ gap: 56 }}>
        <header className="hm-page-head">
          <p className="hm-kicker">Work</p>
          <h1>What I built, and which part was mine</h1>
          <p>The roofing platform is team work, and the proposal is my part. The rest are my builds, for clients or for myself, usually from the interface down to the database. Open one to see what was hard and how I handled it.</p>
        </header>
        <Flagship level={2} />
        <ProjectList items={otherProjects} level={2} />
      </div>
      <Footer />
    </>
  );
}
