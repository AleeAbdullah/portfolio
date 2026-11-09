import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Head from "next/head";
import { cn } from "@/src/lib/utils";

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
  title: "Ali Abdullah — Software Engineer",
  description:
    "Ali Abdullah is a software engineer in Lahore. He builds roofing quote tools at Ripeseed.io, and posts what he learns: long reads on the blog, quick fixes in field notes.",
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
      </head>
      <Head>
        <link
          rel="stylesheet"
          href="https://unicons.iconscout.com/release/v4.0.8/css/line.css"
        />
        <link
          href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
          rel="stylesheet"
        />
      </Head>
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
