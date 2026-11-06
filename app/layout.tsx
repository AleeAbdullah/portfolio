import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Head from "next/head";
import { cn } from "@/src/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ali Abdullah — The Workstation",
  description:
    "Step into Ali Abdullah's interactive workspace. Explore the skills, experience, and projects of a full stack web and mobile developer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
          "transition-colors duration-300"
        )}
      >
        {children}
      </body>
    </html>
  );
}
