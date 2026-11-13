import type { Activity } from "@/src/lib/github";

export type DeskPost = { slug: string; title: string; date: string; summary: string; minutes: number; draft: boolean };
export type DeskNote = { slug: string; title: string; date: string; html: string; draft: boolean };
export type DeskProject = { title: string; description: string; techStack: string[]; features: string[]; image: string | null; live: string | null; github: string | null };
export type DeskJob = { company: string; role: string; period: string };
export type DeskData = { posts: DeskPost[]; notes: DeskNote[]; projects: DeskProject[]; jobs: DeskJob[]; activity: Activity };

// Each section of the site lives on one object in the room.
export type Spot = "blog" | "notes" | "work" | "now" | "experience" | "about" | "contact" | "activity";
export type Target = Spot | "lamp";

export const spots: { id: Spot; label: string; object: string }[] = [
  { id: "blog", label: "Blog", object: "Newspaper" },
  { id: "notes", label: "Field notes", object: "Corkboard" },
  { id: "work", label: "Work", object: "Computer" },
  { id: "now", label: "Now", object: "Work badge" },
  { id: "experience", label: "Experience", object: "Badges" },
  { id: "about", label: "About", object: "Frame" },
  { id: "contact", label: "Contact", object: "Phone" },
  { id: "activity", label: "Activity", object: "Calendar" },
];

export const isSpot = (value: string | null): value is Spot => spots.some((spot) => spot.id === value);

type Vec = [number, number, number];
// Camera position and look-at point for the room and for each object. Close-ups keep the
// object left of centre, because the reading panel covers the right side of the screen.
export const views: Record<"room" | Spot, { pos: Vec; target: Vec }> = {
  room: { pos: [0.1, 2.0, 2.8], target: [-0.02, 1.05, -0.2] },
  blog: { pos: [-0.06, 1.22, 0.62], target: [-0.36, 0.8, 0.1] },
  notes: { pos: [-0.52, 1.63, 0.40], target: [-0.52, 1.57, -0.79] },
  work: { pos: [0.3, 1.16, 1.12], target: [0.14, 1.1, -0.16] },
  now: { pos: [-0.128, 1.62, -0.12], target: [-0.128, 1.62, -0.795] },
  experience: { pos: [0.90, 1.15, 0], target: [0.90, 1.12, -0.78] },
  about: { pos: [-0.67, 0.92, 0.58], target: [-0.72, 0.85, 0.28] },
  contact: { pos: [0.46, 1.0, 0.56], target: [0.45, 0.85, 0.18] },
  activity: { pos: [1.39, 1.6, 0.12], target: [1.39, 1.6, -0.79] },
};

// Steam: GitHub's last contribution day (any kind, taken as UTC) as of the last build is today, so a later push is missed.
export const coffeeHot = (activity: Activity) => activity.lastActive === new Date().toISOString().slice(0, 10);

// Part of each screenshot the monitor shows, as [x, y, width, height] fractions: one phone screen, or the laptop's display.
export const screenCrops: Record<string, [number, number, number, number]> = {
  "Tally Stick": [0.1, 0.05, 0.24, 0.9],
  FitKraft: [0.1, 0.05, 0.24, 0.9],
};

export const screenImages: Record<string, string> = {
  "Safe Buy Africa": "/models/desk/screens/safe-buy-africa.webp",
  "Healing Hands CPR": "/models/desk/screens/healing-hands-cpr.webp",
};
