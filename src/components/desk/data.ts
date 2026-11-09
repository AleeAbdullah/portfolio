import type { Activity } from "@/src/lib/github";

export type DeskPost = { slug: string; title: string; date: string; summary: string; minutes: number; draft: boolean };
export type DeskNote = { slug: string; title: string; date: string; html: string; draft: boolean };
export type DeskProject = { title: string; description: string; techStack: string[]; features: string[]; image: string | null; live: string | null; github: string | null };
export type DeskJob = { company: string; role: string; period: string };
export type DeskData = { posts: DeskPost[]; notes: DeskNote[]; projects: DeskProject[]; jobs: DeskJob[]; activity: Activity };

// Each section of the site lives on one object in the room.
export type Spot = "blog" | "notes" | "work" | "experience" | "about" | "contact" | "activity";
export type Target = Spot | "lamp";

export const spots: { id: Spot; label: string; object: string }[] = [
  { id: "blog", label: "Blog", object: "Newspaper" },
  { id: "notes", label: "Field notes", object: "Corkboard" },
  { id: "work", label: "Work", object: "Computer" },
  { id: "experience", label: "Experience", object: "Badges" },
  { id: "about", label: "About", object: "Photo" },
  { id: "contact", label: "Contact", object: "Phone" },
  { id: "activity", label: "Activity", object: "Calendar" },
];

export const isSpot = (value: string | null): value is Spot => spots.some((spot) => spot.id === value);

type Vec = [number, number, number];
// Camera position and look-at point for the room and for each object. Close-ups keep the
// object left of centre, because the reading panel covers the right side of the screen.
export const views: Record<"room" | Spot, { pos: Vec; target: Vec }> = {
  room: { pos: [1.55, 1.6, 2.45], target: [-0.2, 1.05, -0.1] },
  blog: { pos: [-0.06, 1.22, 0.62], target: [-0.36, 0.8, 0.1] },
  notes: { pos: [-0.5, 1.5, 0.45], target: [-0.6, 1.48, -0.79] },
  work: { pos: [0.3, 1.16, 1.12], target: [0.14, 1.1, -0.16] },
  experience: { pos: [1.02, 1.06, 0.12], target: [0.86, 1.04, -0.78] },
  about: { pos: [0.6, 1.08, 0.5], target: [0.42, 0.88, -0.22] },
  contact: { pos: [0.66, 1.24, 0.82], target: [0.5, 0.8, 0.16] },
  activity: { pos: [0.55, 1.58, 0.15], target: [0.44, 1.6, -0.79] },
};
