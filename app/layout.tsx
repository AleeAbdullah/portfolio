import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/src/lib/utils";
import { FEED_ALTERNATE, SAME_AS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/src/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

const themeScript = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t;matchMedia("(prefers-color-scheme: light)").addEventListener("change",function(e){try{if(!localStorage.getItem("theme"))document.documentElement.dataset.theme=e.matches?"light":"dark"}catch(_){}})}catch(e){document.documentElement.dataset.theme="dark"}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Ali Abdullah — Product Engineer · Next.js, React Native, AI",
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME, url: `${SITE_URL}/about/` }],
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Ali Abdullah, product engineer in Lahore" }] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  alternates: { types: FEED_ALTERNATE },
  verification: { google: "JWXqRlOnBQk5kcdurXduspn59A7zDgNWiMcbtztiiRw" },
};

const personLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      jobTitle: "Product Engineer",
      worksFor: { "@type": "Organization", name: "Ripeseed.io", url: "https://ripeseed.io" },
      address: { "@type": "PostalAddress", addressLocality: "Lahore", addressCountry: "PK" },
      knowsAbout: ["Next.js", "React", "React Native", "Expo", "Django", "NestJS", "PostgreSQL", "TypeScript", "Product engineering", "AI features"],
      sameAs: SAME_AS,
    },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME, author: { "@id": `${SITE_URL}/#person` } },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets the theme before first paint: the saved choice, else the system setting. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      </head>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          archivo.variable,
          instrument.variable,
          jetbrains.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
