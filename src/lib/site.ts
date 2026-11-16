// One place for the site's public address and identity, used by metadata, the sitemap, the feed and JSON-LD.
export const SITE_URL = "https://aleeabdullah.vercel.app";
export const SITE_NAME = "Ali Abdullah";
export const SITE_DESCRIPTION =
  "Ali Abdullah is a product engineer in Lahore who builds web and mobile products end to end: Next.js and Django platforms, React Native apps and AI features.";
export const SAME_AS = ["https://github.com/AleeAbdullah", "https://www.linkedin.com/in/ali-abdullah-854716224"];

// A Person reference that names Ali in full, so a page's JSON-LD makes sense without the root layout's block.
export const personRef = { "@type": "Person", "@id": `${SITE_URL}/#person`, name: SITE_NAME, url: `${SITE_URL}/` };

// Next replaces the layout's alternates on any page that sets its own, so pages spread this in to keep RSS autodiscovery.
export const FEED_ALTERNATE = { "application/rss+xml": "/feed.xml" };

// Absolute URL for a site path; trailingSlash is on, so pages end in "/".
export const absolute = (path: string) => new URL(path, SITE_URL).toString();
