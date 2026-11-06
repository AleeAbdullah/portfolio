export type PortfolioProject = {
  title: string;
  category: "web" | "app";
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
};

export const projects: PortfolioProject[] = [
  {
    "title": "Roofing Estimation & Contractor Portal",
    "explainer": "roofing-proposal",
    "category": "web",
    "description": "A contractor platform for turning roof measurements into material estimates, supplier pricing, and customer proposals.",
    "overview": [
      "Leads and contractor referrals connect project activity with roof reports and quotes. Contractors can work from scanned documents, external reports, manual measurements, or direct material quantities. The calculation workflow accounts for roof scope, waste, and product coverage.",
      "Supplier responses retain separate pricing versions. Contractors can select a response, configure selling prices, and generate a customer proposal as a downloadable PDF."
    ],
    "techStack": [
      "Next.js",
      "Django"
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
    "title": "Hissab",
    "category": "app",
    "description": "Hissab keeps shared expenses, group balances, and personal spending in one mobile app.",
    "overview": [
      "People can record who paid, track what others owe, and log settlements. Group activity and reminders help participants follow outstanding balances. Personal transaction records and spending reports cover expenses outside shared groups.",
      "The backend preserves expense history and supports realtime updates, account exports, and account deletion."
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
    "images": [],
    "github": null,
    "live": null
  },
  {
    "title": "FitKraft",
    "category": "app",
    "description": "FitKraft helps people plan their protein intake and keep a consistent resistance-training log.",
    "overview": [
      "Meal suggestions adjust around what has been eaten, skipped, or missed. Workout records and progress tracking sit alongside daily nutrition. SQLite keeps logging available offline; account backup and synchronization run through a Django backend."
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
      "Offline logging with account backup and synchronization"
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
    "images": [],
    "github": null,
    "live": null
  },
  {
    "title": "RoadLedger",
    "category": "web",
    "description": "RoadLedger turns a truck journey into a route, a driving schedule, and a set of daily logs.",
    "overview": [
      "The planning workflow combines route comparison with hours-of-service scheduling. Users can review and edit the generated plan, then download or print the resulting logs."
    ],
    "techStack": [
      "Next.js",
      "Django REST Framework",
      "Google Maps APIs"
    ],
    "features": [
      "Route comparison",
      "Hours-of-service scheduling",
      "Editable plans and downloadable or printable logs"
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
    "title": "Safe Buy Africa",
    "category": "app",
    "description": "Safe Buy Africa brings customer shopping, seller tools, and marketplace administration into a connected commerce platform.",
    "overview": [
      "The mobile app covers product discovery and shopping flows, with dedicated experiences for customers and sellers. A separate web dashboard supports marketplace administration. Firebase, Supabase, and Paystack integrations provide the supporting data and payment functionality."
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
      "/mockups/safe buy.webp"
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
    "category": "web",
    "description": "FlowDex connects a public token launch with wallet-based purchases and payment monitoring.",
    "overview": [
      "Buyers can review sale information, connect a compatible wallet, and follow a network-specific checkout. Purchase records track submitted transactions and their confirmation status. An administrative workspace supports payment review across the supported networks."
    ],
    "techStack": [
      "Next.js",
      "NestJS",
      "PostgreSQL",
      "Redis",
      "BullMQ",
      "Blockchain integrations"
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
    "images": [],
    "github": null,
    "live": null
  },
  {
    "title": "RouteMate",
    "category": "app",
    "description": "RouteMate matches drivers and riders who make compatible recurring journeys.",
    "overview": [
      "Users set up their commute through map-based route selection, travel schedules, and driver or rider preferences. They can explore potential matches, review commute details, and manage connections.",
      "The project combines a mobile onboarding and matching experience with geospatial data in PostgreSQL/PostGIS."
    ],
    "techStack": [
      "React Native",
      "Expo",
      "Supabase",
      "PostgreSQL/PostGIS",
      "Google Maps"
    ],
    "features": [
      "Map-based commute setup",
      "Travel schedules and driver or rider preferences",
      "Potential matches and connection management"
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
    "images": [],
    "github": null,
    "live": null
  },
  {
    "title": "Seasons Taiwanese Eatery",
    "category": "web",
    "description": "A restaurant website backed by tools for managing menus, content, and customer engagement.",
    "overview": [
      "The customer-facing storefront presents the restaurant and its menu. An administration dashboard supports updates to the site and its content, bringing public presentation and restaurant management into the same platform."
    ],
    "techStack": [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Firebase",
      "Rive"
    ],
    "features": [
      "Restaurant storefront and menu",
      "Site and content administration",
      "Customer engagement tools"
    ],
    "images": [
      "/mockups/seasons.webp"
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
    "github": null,
    "live": null
  },
  {
    "title": "Healing Hands CPR",
    "category": "web",
    "description": "A course registration platform for CPR training.",
    "overview": [
      "Visitors can browse available courses, complete a guided registration, and pay through Stripe checkout. Administrative tools provide access to transaction and order records, connecting course enrolment with payment management."
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
      "/mockups/cpr.webp"
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
    "category": "web",
    "description": "A software studio website that explains technical services through interactive visuals and project stories.",
    "overview": [
      "Custom illustrations show how software and automation workflows operate. Service pages and selected work provide more detail, while contact flows and certificate verification support the studio’s business activities."
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
    "images": [],
    "github": null,
    "live": null
  }
];

export const experiences = [
  { company: "Ripeseed.io", role: "Software Engineer", period: "Aug 2025 — Present", location: "Lahore, Pakistan", description: "Building a Django and Next.js contractor platform connecting roof measurements, material estimates, supplier pricing, and customer proposals." },
  { company: "Tech Grus", role: "Software Engineer", period: "Feb 2024 — Jul 2025", location: "Remote", description: "Built Next.js and NestJS restaurant applications with ordering, payments, dashboards, and loyalty features." },
  { company: "Upwork", role: "Freelance Software Developer", period: "2021 — 2024", location: "Remote", description: "Delivered web and mobile applications with React, Next.js, React Native, Node.js, Firebase, and Supabase, from frontend development through deployment." },
];

export const skillGroups = [
  { title: "Web & interfaces", skills: ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "HTML & CSS"] },
  { title: "Mobile", skills: ["React Native", "Expo", "React Native Reanimated"] },
  { title: "Backend & data", skills: ["Node.js", "Express.js", "Django", "Firebase", "Supabase", "PostgreSQL"] },
];

export const roomSections = [
  { id: "skills", label: "Skills", object: "The bookshelf", number: "01", description: "The tools I reach for." },
  { id: "experience", label: "Experience", object: "The pinboard", number: "02", description: "The journey so far." },
  { id: "projects", label: "Projects", object: "The workstation", number: "03", description: "A few things I've built." },
] as const;

export type RoomSection = (typeof roomSections)[number]["id"];
