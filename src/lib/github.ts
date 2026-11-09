import snapshot from "./github-snapshot.json";

// GitHub activity, read at build time. Without a GITHUB_TOKEN (or if GitHub fails),
// the build uses the last saved snapshot so it never breaks.
export type Activity = {
  total: number; // contributions in the last year
  lastActive: string; // YYYY-MM-DD of the latest day with a contribution
  start: string; // YYYY-MM-DD of the first day in weeks
  weeks: number[][]; // last 15 weeks, Sunday first; the current week may be partial
};

const query = `{ user(login: "AleeAbdullah") { contributionsCollection { contributionCalendar {
  totalContributions weeks { contributionDays { contributionCount date } } } } } }`;

type Calendar = { totalContributions: number; weeks: { contributionDays: { contributionCount: number; date: string }[] }[] };

async function load(): Promise<Activity> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return snapshot;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const calendar: Calendar | undefined = (await res.json())?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) return snapshot;
    const days = calendar.weeks.flatMap((week) => week.contributionDays);
    const recent = calendar.weeks.slice(-15);
    return {
      total: calendar.totalContributions,
      lastActive: days.filter((day) => day.contributionCount > 0).at(-1)?.date ?? snapshot.lastActive,
      start: recent[0].contributionDays[0].date,
      weeks: recent.map((week) => week.contributionDays.map((day) => day.contributionCount)),
    };
  } catch {
    return snapshot;
  }
}

let pending: Promise<Activity> | undefined;
export const getActivity = () => (pending ??= load());
