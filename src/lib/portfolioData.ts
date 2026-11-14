export type PortfolioProject = {
  title: string;
  category: "web" | "app";
  kind: "Team" | "Client" | "Personal" | "Studio";
  description: string;
  overview: string[];
  tier: "main" | "supporting";
  details: { label: string; value: string }[];
  techStack: string[];
  features: string[];
  images: string[];
  github: string | null;
  live: string | null;
  explainer?: "roofing-proposal";
  post?: string; // slug of the blog post about this project
};

export const projects: PortfolioProject[] = [
  {
    "title": "Brava Pro Portal",
    "kind": "Team",
    "post": "modelling-a-roofing-estimate",
    "explainer": "roofing-proposal",
    "category": "web",
    "description": "Brava Roof Tile's platform for roofing contractors: from roof measurements to a materials estimate, supplier pricing and a branded proposal PDF.",
    "overview": [
      "Brava Pro Portal is the Django and Next.js platform a small Ripeseed team builds for Brava Roof Tile, a US roofing tile manufacturer. I've worked on it since August 2025, mostly on the frontend. Contractors start from whatever they have: a scanned document, an external roof report, hand-entered measurements or material quantities. The platform works out materials from roof scope, waste and product coverage, and suppliers send back priced versions of the list.",
      "My part is the proposal. I built the editor contractors use to change a proposal's pages, copy, layout and brand colour, and save it as a template for the next job. I also built the Django code that works out the proposal's money in one place, so the preview, the PDF and the totals all read the same calculated amounts. Pages can group or hide an amount, but never change one.",
      "Across the whole platform, by Brava's own before-and-after, working out a job's materials by hand took its team about 3 days. With the platform's in-house measurement tools it takes about 7 minutes."
    ],
    "techStack": [
      "Next.js",
      "Django",
      "React PDF"
    ],
    "features": [
      "Roof measurements and material estimates",
      "Separate supplier pricing versions",
      "Customer proposals as downloadable PDFs"
    ],
    "tier": "main",
    "details": [
      {
        "label": "Platform",
        "value": "Web"
      },
      {
        "label": "Selection",
        "value": "Main project"
      }
    ],
    "images": [],
    "github": null,
    "live": null
  },
  {
    "title": "Tally Stick",
    "kind": "Personal",
    "post": "money-and-realtime-in-a-shared-expenses-app",
    "category": "app",
    "description": "A shared-expenses app where every balance is summed from a history that can't be edited, only corrected.",
    "overview": [
      "Personal project, built on my own since August 2026 and now being prepared for the App Store and Google Play. It was called Hissab until November 2026. Groups record who paid and who owes, then settle up in cash or by transfer and log it. Personal spending and reports sit alongside the shared groups.",
      "Amounts are bigints in minor units. Balances are summed from an append-only ledger: a Postgres trigger rejects every update or delete, so a correction is a reversal plus a new version. A transactional outbox tells every phone in the group to refetch. The currency symbol on screen is a per-person display setting."
    ],
    "techStack": [
      "React Native",
      "Expo",
      "NestJS",
      "PostgreSQL",
      "Drizzle",
      "Socket.IO"
    ],
    "features": [
      "Shared expenses, balances, and settlements",
      "Personal transaction records and spending reports",
      "Realtime updates, account exports, and account deletion"
    ],
    "tier": "main",
    "details": [
      {
        "label": "Platform",
        "value": "Mobile"
      },
      {
        "label": "Selection",
        "value": "Main project"
      }
    ],
    "images": [
      "/mockups/tally-stick.webp"
    ],
    "github": "https://github.com/AleeAbdullah/hissab",
    "live": "https://hissabapp.vercel.app"
  },
  {
    "title": "FitKraft",
    "kind": "Personal",
    "category": "app",
    "description": "A protein planner and training log that keeps working with no signal.",
    "overview": [
      "A personal prototype I built on my own in October 2026. It spreads the protein you still need across your remaining meals, and re-spreads it when you skip or miss one. Workouts, progress and weight live next to the day's meals.",
      "Every change is saved to SQLite on the phone first and queued in a local outbox. The queue syncs to a Django backend with backoff, and a background pull skips any row with an upload still pending or in flight. After five failed attempts, a change is flagged for attention instead of retrying forever."
    ],
    "techStack": [
      "React Native",
      "Expo",
      "SQLite",
      "Drizzle",
      "Django",
      "PostgreSQL"
    ],
    "features": [
      "Protein planning and meal suggestions",
      "Resistance-training logs and progress tracking",
      "Offline logging with account backup and synchronisation"
    ],
    "tier": "main",
    "details": [
      {
        "label": "Platform",
        "value": "Mobile"
      },
      {
        "label": "Selection",
        "value": "Main project"
      }
    ],
    "images": [
      "/mockups/fitkraft-plan.webp"
    ],
    "github": null,
    "live": null
  },
  {
    "title": "Safe Buy Africa",
    "kind": "Client",
    "category": "app",
    "description": "A marketplace app where one Paystack checkout pays several sellers at once.",
    "overview": [
      "I built the Expo app and the Next.js admin dashboard between 2025 and early 2026. Customers and sellers each get their own side of the app, with Supabase behind search and the catalogue.",
      "A cart can hold products from several sellers. At checkout, a Firebase Cloud Function checks stock and builds a Paystack split, so each seller's share goes to their own subaccount. The payment webhook verifies Paystack's signature, then creates one order per seller. The checkout is built, but it's switched off in the current app."
    ],
    "techStack": [
      "React Native",
      "Expo",
      "Next.js",
      "Firebase",
      "Supabase",
      "Paystack"
    ],
    "features": [
      "Product discovery and shopping flows",
      "Dedicated customer and seller experiences",
      "Marketplace administration dashboard"
    ],
    "images": [
      "/mockups/safe-buy.webp"
    ],
    "tier": "main",
    "details": [
      {
        "label": "Platform",
        "value": "Mobile"
      },
      {
        "label": "Selection",
        "value": "Main project"
      }
    ],
    "github": null,
    "live": null
  },
  {
    "title": "FlowDex",
    "kind": "Client",
    "category": "web",
    "description": "A token sale checkout that follows each crypto payment from the wallet to confirmation.",
    "overview": [
      "I built all of it, frontend to database, between March and August 2026. Buyers prove they own a wallet by signing a one-time challenge, then pay on one of the supported chains.",
      "Each payment moves through a strict state machine, from waiting through confirming to confirmed. Amounts are compared as integers in base units, so a short, over or late payment gets its own state instead of passing quietly. Incoming transfer webhooks are checked against an HMAC signature, and a unique key on chain, transaction and receiver means the same transfer can only be recorded once."
    ],
    "techStack": [
      "Next.js",
      "NestJS",
      "PostgreSQL",
      "TypeORM",
      "viem"
    ],
    "features": [
      "Wallet connections and network-specific checkout",
      "Transaction records and confirmation status",
      "Administrative payment review"
    ],
    "tier": "main",
    "details": [
      {
        "label": "Platform",
        "value": "Web"
      },
      {
        "label": "Selection",
        "value": "Main project"
      }
    ],
    "images": [
      "/mockups/flowdex.webp"
    ],
    "github": "https://github.com/AleeAbdullah/flowdexMVP",
    "live": null
  },
  {
    "title": "Healing Hands CPR",
    "kind": "Client",
    "category": "web",
    "description": "Course sign-up and Stripe checkout for a CPR instructor, live at healinghandusa.com.",
    "overview": [
      "I built it for a CPR instructor in 2025, to replace cash payments and manual scheduling. Students pick a course, register in a few steps and pay through Stripe Checkout, and the instructor sees every order.",
      "The site is a static Next.js export with no server of its own. Supabase Edge Functions create the checkout session and verify Stripe's webhook signature before recording a payment."
    ],
    "techStack": [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Supabase",
      "Stripe"
    ],
    "features": [
      "Course browsing and guided registration",
      "Stripe checkout",
      "Transaction and order administration"
    ],
    "images": [
      "/mockups/healing-hands.webp"
    ],
    "live": "https://healinghandusa.com/",
    "tier": "supporting",
    "details": [
      {
        "label": "Platform",
        "value": "Web"
      },
      {
        "label": "Selection",
        "value": "Supporting project"
      }
    ],
    "github": null
  },
  {
    "title": "Scoopcodes",
    "kind": "Studio",
    "category": "web",
    "description": "The site for Scoopcodes, the small software studio I co-founded in 2023.",
    "overview": [
      "I built the studio's site on my own in 2026, in Next.js. The site live at scoopcodesllc.com is an earlier version. The rebuild I'm finishing, pictured here, adds interactive 3D illustrations of each service in React Three Fiber, next to service pages, case studies and a contact flow."
    ],
    "techStack": [
      "Next.js",
      "React",
      "TypeScript",
      "Three.js",
      "React Three Fiber"
    ],
    "features": [
      "Interactive software and automation illustrations",
      "Service pages and selected project stories",
      "Contact flows and certificate verification"
    ],
    "tier": "supporting",
    "details": [
      {
        "label": "Platform",
        "value": "Web"
      },
      {
        "label": "Selection",
        "value": "Supporting project"
      }
    ],
    "images": [
      "/mockups/scoopcodes.webp"
    ],
    "github": null,
    "live": "https://scoopcodesllc.com"
  }
];

export const experiences = [
  { company: "Ripeseed.io", role: "Software Engineer", period: "Aug 2025 — Present", location: "Lahore, Pakistan", description: "Mostly frontend, on a small team building a Django and Next.js platform for Brava Roof Tile, a US roofing tile manufacturer." },
  { company: "Scoopcodes", role: "Co-founder", period: "2023 — Present", location: "Pakistan", description: "A small software studio I co-founded alongside my full-time roles. I built its site, and I'm finishing a rebuild with interactive Three.js explainers of each service." },
  { company: "Tech Grus", role: "Software Engineer", period: "Dec 2024 — Aug 2025", location: "Remote", description: "Built online ordering for two restaurant brands in Next.js and Firebase: installable web apps for customers, admin dashboards for menus and orders, and loyalty features." },
  { company: "Upwork", role: "Freelance Software Developer", period: "2021 — 2024", location: "Remote", description: "Three years of client work: web and mobile apps in React, Next.js and React Native, on Firebase and Supabase." },
  { company: "724.One", role: "React Native Intern", period: "Sep 2023 — Jan 2024", location: "Pakistan", description: "My first job on a team: four months of React Native in sprints, refactoring components and fixing UI bugs." },
];

export const skillGroups = [
  { title: "Web & interfaces", skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "React PDF", "Three.js"] },
  { title: "Mobile", skills: ["React Native", "Expo", "SQLite", "Drizzle", "Socket.IO"] },
  { title: "Backend & data", skills: ["Django", "NestJS", "PostgreSQL", "Firebase", "Supabase", "Stripe", "Paystack"] },
];

export const email = "ali.37803990@gmail.com";
