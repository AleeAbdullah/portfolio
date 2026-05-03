"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type FeaturedWorkItem = {
  id: string;
  title: string;
  projectUrl: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  badge: string[];
  summary: string;
  ctaLabel?: string;
  isInternal?: boolean;
};

const featuredWork = [
  {
    id: "seasons-restaurant-showcase",
    title: "Seasons Restaurant Web Showcase",
    projectUrl: "https://seasonseateryhi.com/",
    image: "/portfolio-images/mockups/seasons.webp",
    imageWidth: 4500,
    imageHeight: 3000,
    badge: ["Web", "Branding", "Showcase"],
    summary:
      "Designed this Seasons Restaurant showcase visual to present the website with a premium, on-brand feel. I shaped the composition to highlight both interface quality and brand personality, so the first impression feels polished, appetizing, and confidently digital.",
  },
  {
    id: "greattemplatesart-layout-one",
    title: "Twitch Stream Package Design",
    projectUrl: "https://greatvtubers.com/",
    image: "/portfolio-images/great-templates-art/twitch-overlay/layout-1.webp",
    imageWidth: 1920,
    imageHeight: 1080,
    badge: ["Illustrator", "Canva", "Branding"],
    summary:
      "Built this stream package from scratch in Adobe Illustrator, including every frame and visual element. I then prepared the listing in Canva so the marketplace presentation felt polished, clear, and conversion-focused while keeping the style personality-forward.",
  },
  {
    id: "safebuy-app-branding",
    title: "SafeBuy App Branding Showcase",
    projectUrl: "https://safebuy.africa/",
    image: "/portfolio-images/mockups/safe buy.webp",
    imageWidth: 4500,
    imageHeight: 3000,
    badge: ["Mobile", "Branding", "App"],
    summary:
      "Created this SafeBuy branding visual to showcase the mobile app with clarity and confidence. The goal was to make the app feel reliable, modern, and easy to trust, while keeping the design language consistent with the product’s identity and communication style.",
  },
  {
    id: "scoopcodes-post-one",
    title: "Campaign Social Creative",
    projectUrl: "https://www.linkedin.com/company/scoopcodes/posts/",
    image: "/portfolio-images/scoopcodes/1.webp",
    imageWidth: 1200,
    imageHeight: 1200,
    badge: ["Social", "Identity", "Engagement"],
    summary:
      "Created this Scoopcodes social creative to strengthen recognition and keep campaign messaging visually aligned with the brand system. I focused on strong contrast, disciplined spacing, and clear focal points so the design grabs attention and stays easy to understand.",
  },
  {
    id: "ripeseed-drive-sheet",
    title: "Brand Awareness Post Design",
    projectUrl: "https://ripeseed.io/",
    image: "/portfolio-images/ripeseed/1.1.webp",
    imageWidth: 2048,
    imageHeight: 1152,
    badge: ["LinkedIn", "Marketing", "Awareness"],
    summary:
      "Designed this social post to increase brand awareness and communicate visual direction with clarity. The goal was to make the message feel informative without losing style, so the composition balances readable hierarchy, brand consistency, and a clean, professional finish.",
  },
  {
    id: "coffee-shop-social-set",
    title: "Coffee Shop Campaign Social Set",
    projectUrl: "/work#coffee-shop",
    image: "/portfolio-images/coffee%20shop/5.png",
    imageWidth: 1080,
    imageHeight: 1080,
    badge: ["Social", "Cafe", "Campaign"],
    ctaLabel: "View Gallery",
    isInternal: true,
    summary:
      "Designed this coffee shop campaign set with warm product imagery, bold offer messaging, and a clean social-first layout. The visual direction keeps the cafe brand approachable and premium while making each post easy to scan in a busy feed.",
  },
  {
    id: "creative-company-brand-campaign",
    title: "Creative Company Brand Campaign",
    projectUrl: "/work#creative-company",
    image: "/portfolio-images/creative%20company/1.png",
    imageWidth: 1200,
    imageHeight: 1200,
    badge: ["Branding", "Social", "Creative"],
    ctaLabel: "View Gallery",
    isInternal: true,
    summary:
      "Created this creative company campaign to present brand strategy with confident typography, structured shapes, and editorial business imagery. The result feels energetic and professional while staying aligned with a clear visual identity.",
  },
] satisfies FeaturedWorkItem[];

const Projects = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24" id="work">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-34 h-50 w-50 -translate-x-1/2 rounded-full bg-rose-500/30 blur-[110px]" />
        <div className="absolute -left-16 top-[45%] h-72 w-72 rounded-full bg-rose-400/20 blur-[110px]" />
        <div className="absolute right-0 top-[70%] h-72 w-72 rounded-full bg-pink-400/20 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="relative mb-10 flex flex-col items-center gap-4 md:mb-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-100 md:text-4xl">Featured Projects</h2>
            <p className="mt-2 text-rose-500">Selected Work</p>
          </div>
          <Link
            href="/work"
            className="inline-flex items-center justify-center self-center rounded-full border border-white/20 bg-gradient-to-r from-rose-200/20 via-pink-200/15 to-slate-100/20 px-6 py-2.5 text-sm font-medium text-gray-100 backdrop-blur-2xl shadow-[0_18px_50px_-26px_rgba(244,114,182,0.8)] transition hover:border-white/35 hover:text-white md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2"
          >
            Show all projects
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-10 md:gap-15">
          {featuredWork.map((item, index) => {
            const isReversed = index % 2 === 1;
            const isLast = index === featuredWork.length - 1;

            return (
              <article key={item.id} className="relative py-2">
                <div
                  className={`relative ${isReversed ? "ml-0 mr-auto" : "ml-auto mr-0"
                    } w-full max-w-[568px]`}
                >
                  <div className="absolute inset-0 rounded-2xl bg-rose-500/20 blur-2xl" />
                  <div className="relative w-full overflow-hidden rounded-2xl border border-rose-300/20 bg-gray-900/70 shadow-[0_20px_50px_-20px_rgba(244,63,94,0.45)]">
                    <Image
                      src={item.image}
                      alt="Featured work preview"
                      width={item.imageWidth}
                      height={item.imageHeight}
                      sizes="(max-width: 768px) 100vw, 568px"
                      priority={index === 0}
                      className="h-auto w-full opacity-95"
                    />
                  </div>
                </div>

                <div
                  className={`relative z-20 mt-4 w-full max-w-[669px] rounded-2xl border border-white/20 bg-gradient-to-r from-rose-200/20 via-pink-200/15 to-slate-100/20 p-5 text-gray-100 backdrop-blur-2xl shadow-[0_18px_50px_-26px_rgba(244,114,182,0.8)] md:mt-[-170px] md:p-8 ${isReversed
                    ? "ml-auto mr-0 text-left lg:mr-[72px]"
                    : "ml-0 mr-auto text-left lg:ml-[72px]"
                    }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300/90">
                      Featured Project
                    </p>
                    {item.isInternal ? (
                      <Link
                        href={item.projectUrl}
                        className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-rose-100 transition hover:border-white/40 hover:bg-white/15 hover:text-white"
                      >
                        {item.ctaLabel ?? "View Project"}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <a
                        href={item.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-rose-100 transition hover:border-white/40 hover:bg-white/15 hover:text-white"
                      >
                        {item.ctaLabel ?? "Visit Project"}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <h3 className="mb-4 text-2xl font-semibold text-rose-100 md:text-4xl">
                    {item.title}
                  </h3>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.badge.map((token) => (
                      <span
                        key={token}
                        className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-100"
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-100/90 md:text-lg">
                    {item.summary}
                  </p>
                </div>

                {!isLast && (
                  <div className="mt-8 border-t border-white/15 md:hidden" aria-hidden="true" />
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Projects;
