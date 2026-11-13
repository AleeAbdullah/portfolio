import type { Metadata } from "next";
import { screenImages } from "@/src/components/desk/data";
import Desk from "@/src/components/desk/Desk";
import { Experience } from "@/src/components/home/sections";
import { formatDate, getNotes, getPosts } from "@/src/lib/content";
import { getActivity } from "@/src/lib/github";
import { experiences, projects } from "@/src/lib/portfolioData";

export const metadata: Metadata = {
  title: "The Desk — Ali Abdullah",
  description: "Ali Abdullah's desk: a 3D room where the newspaper is the blog, the corkboard holds field notes and the computer plays his work.",
};

export default async function DeskPage() {
  const data = {
    posts: getPosts().map(({ slug, title, date, summary, minutes, draft }) => ({ slug, title, date: formatDate(date), summary, minutes, draft })),
    notes: getNotes().map(({ slug, title, date, html, draft }) => ({ slug, title, date: formatDate(date, "long"), html, draft })),
    projects: projects.map(({ title, description, techStack, features, images, live, github }) => ({ title, description, techStack, features: features.slice(0, 5), image: screenImages[title] ?? images[0] ?? null, live, github })),
    jobs: experiences.map(({ company, role, period }) => ({ company, role, period })),
    activity: await getActivity(),
  };
  return <Desk data={data} job={experiences[0]} experience={<Experience />} />;
}
