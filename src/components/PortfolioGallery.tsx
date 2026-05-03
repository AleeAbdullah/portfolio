"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { Home } from "lucide-react";
import { PortfolioGallery as HeroPortfolioGallery } from "@/components/ui/portfolio-gallery";
import { BackgroundPathLines } from "@/components/ui/background-paths";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

type GalleryCategory = {
  id: string;
  title: string;
  subtitle: string;
  summaryHeading: string;
  summary: string;
  images: string[];
};

const categories: GalleryCategory[] = [
  {
    id: "app-web-design",
    title: "App and Web Design",
    subtitle: "Product, UI, and branding visuals across web and mobile",
    summaryHeading: "Product showcase and UI direction",
    summary:
      "I created web and app visuals that make digital products feel clear, trustworthy, and launch-ready through polished UI mockups, brand-led compositions, and focused product storytelling.",
    images: [
      "/portfolio-images/mockups/seasons.webp",
      "/portfolio-images/mockups/seasons2.png",
      "/portfolio-images/mockups/safe%20buy.webp",
      "/portfolio-images/mockups/fitkraft.webp",
      "/portfolio-images/mockups/simplfly.webp",
      "/portfolio-images/mockups/simplfly%201.webp",
      "/portfolio-images/mockups/simplfly%202.webp",
      "/portfolio-images/mockups/simplfly%203.webp",
      "/portfolio-images/mockups/cpr2.png",
      "/portfolio-images/mockups/cpr.webp",
      "/portfolio-images/mockups/Knowlegge%20Quran.webp",
      "/portfolio-images/mockups/Knowlegge%20Quran%202.webp",
      "/portfolio-images/mockups/Knowlegge%20Quran%203.webp",
    ],
  },
  {
    id: "great-templates-art",
    title: "The Great Templates Art",
    subtitle: "Stream overlays and listing creatives",
    summaryHeading: "Stream package and marketplace presentation",
    summary:
      "I built stream overlay layouts and listing visuals with a creator-focused identity, balancing expressive illustration, readable frames, and polished marketplace presentation.",
    images: [
      "/portfolio-images/great-templates-art/twitch-overlay/layout-1.webp",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-2.webp",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-3.webp",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-4.webp",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-5.webp",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-6.webp",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-8.webp",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-9.webp",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-10.webp",
    ],
  },
  {
    id: "ripe-seed",
    title: "Ripe Seed",
    subtitle: "Brand communication and campaign creatives",
    summaryHeading: "Professional brand communication",
    summary:
      "I designed campaign creatives with a clean, business-focused visual language so each post feels credible, informative, modern, and aligned with the brand's communication style.",
    images: [
      "/portfolio-images/ripeseed/1.1.webp",
      "/portfolio-images/ripeseed/1.2.webp",
      "/portfolio-images/ripeseed/1.3.webp",
      "/portfolio-images/ripeseed/1.4.webp",
      "/portfolio-images/ripeseed/2.1.webp",
      "/portfolio-images/ripeseed/2.2.webp",
      "/portfolio-images/ripeseed/2.3.webp",
      "/portfolio-images/ripeseed/3.1.webp",
    ],
  },
  {
    id: "scoop-codes",
    title: "Scoop Codes",
    subtitle: "Social content direction and brand consistency",
    summaryHeading: "Social identity and campaign consistency",
    summary:
      "I created social visuals that keep campaign messaging sharp and recognizable, using disciplined spacing, strong contrast, and consistent brand cues across each post.",
    images: [
      "/portfolio-images/scoopcodes/carousal-1.webp",
      "/portfolio-images/scoopcodes/carousal-2.webp",
      "/portfolio-images/scoopcodes/carousal-3.webp",
      "/portfolio-images/scoopcodes/carousal-4.webp",
      "/portfolio-images/scoopcodes/carousal-5.webp",
      "/portfolio-images/scoopcodes/carousal-6.webp",
      "/portfolio-images/scoopcodes/1.webp",
      "/portfolio-images/scoopcodes/2.webp",
      "/portfolio-images/scoopcodes/3.webp",
      "/portfolio-images/scoopcodes/4.webp",
    ],
  },
  {
    id: "coffee-shop",
    title: "Coffee Shop",
    subtitle: "Cafe campaign posts and warm product-led social creatives",
    summaryHeading: "Warm cafe campaign visuals",
    summary:
      "I designed a coffee campaign set with warm product imagery, direct offer messaging, and clean social layouts that feel inviting, premium, and easy to scan.",
    images: [
      "/portfolio-images/coffee%20shop/1.png",
      "/portfolio-images/coffee%20shop/2.png",
      "/portfolio-images/coffee%20shop/3.png",
      "/portfolio-images/coffee%20shop/4.png",
      "/portfolio-images/coffee%20shop/5.png",
    ],
  },
  {
    id: "creative-company",
    title: "Creative Company",
    subtitle: "Brand campaign visuals for a modern creative studio",
    summaryHeading: "Modern creative studio campaign",
    summary:
      "I created a campaign system with confident typography, structured shapes, and editorial imagery to give the creative studio a clear, energetic, professional presence.",
    images: [
      "/portfolio-images/creative%20company/1.png",
      "/portfolio-images/creative%20company/2.png",
      "/portfolio-images/creative%20company/3.png",
      "/portfolio-images/creative%20company/4.png",
      "/portfolio-images/creative%20company/5.png",
      "/portfolio-images/creative%20company/6.png",
    ],
  },
];

const heroPreview = [
  {
    src: "/portfolio-images/mockups/seasons.webp",
    alt: "App and Web Design preview",
    categoryId: "app-web-design",
  },
  {
    src: "/portfolio-images/mockups/safe%20buy.webp",
    alt: "App and Web Design preview",
    categoryId: "app-web-design",
  },
  {
    src: "/portfolio-images/mockups/simplfly.webp",
    alt: "App and Web Design preview",
    categoryId: "app-web-design",
  },
  {
    src: "/portfolio-images/great-templates-art/twitch-overlay/layout-1.webp",
    alt: "The Great Templates Art preview",
    categoryId: "great-templates-art",
  },
  {
    src: "/portfolio-images/great-templates-art/twitch-overlay/layout-8.webp",
    alt: "The Great Templates Art preview",
    categoryId: "great-templates-art",
  },
  {
    src: "/portfolio-images/ripeseed/1.1.webp",
    alt: "Ripe Seed preview",
    categoryId: "ripe-seed",
  },
  {
    src: "/portfolio-images/ripeseed/2.3.webp",
    alt: "Ripe Seed preview",
    categoryId: "ripe-seed",
  },
  {
    src: "/portfolio-images/scoopcodes/1.webp",
    alt: "Scoop Codes preview",
    categoryId: "scoop-codes",
  },
  {
    src: "/portfolio-images/coffee%20shop/5.png",
    alt: "Coffee Shop preview",
    categoryId: "coffee-shop",
  },
  {
    src: "/portfolio-images/creative%20company/1.png",
    alt: "Creative Company preview",
    categoryId: "creative-company",
  },

];

export default function PortfolioGallery() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [slides, setSlides] = useState<{ src: string }[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);

  const scrollToCategory = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openPreview = (images: string[], index: number) => {
    setSlides(images.map((src) => ({ src })));
    setSlideIndex(index);
    setLightboxOpen(true);
  };

  return (
    <section className="text-gray-100">
      <div className="relative overflow-hidden px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-12">
        {/* <BackgroundPathLines className="z-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,black,transparent)]" /> */}

        <div className="relative z-10 md:hidden">
          <div className="mx-auto max-w-3xl rounded-2xl border border-rose-300/20 bg-gray-900/50 p-6 text-center backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-gray-100 sm:text-4xl">Portfolio Gallery</h1>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
              <a
                href="#app-web-design"
                className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90"
              >
                Browse Categories
              </a>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {heroPreview.slice(0, 2).map((image, index) => (
                <button
                  key={`${image.src}-mobile-preview`}
                  onClick={() => scrollToCategory(image.categoryId)}
                  className="relative overflow-hidden rounded-xl border border-rose-300/20 bg-gray-900/60"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={640}
                    height={360}
                    sizes="(max-width: 640px) 92vw, 45vw"
                    priority={index === 0}
                    className="h-auto w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 py-2 text-left text-xs font-medium text-gray-100">
                    Tap to jump to category
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 hidden md:block">
          <HeroPortfolioGallery
            title="Portfolio Gallery"
            archiveButton={{ text: "Browse Categories", href: "#app-web-design" }}
            backButton={{ text: "Back to Home", href: "/" }}
            images={heroPreview}
            className="!px-0 !py-0"
            maxHeight={140}
            spacing="-space-x-48 md:-space-x-64"
            onImageClick={(index) => {
              const target = heroPreview[index];
              if (target) scrollToCategory(target.categoryId);
            }}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 pb-16 sm:space-y-16 sm:px-6 sm:pb-24">
        {categories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            ref={(el) => {
              sectionRefs.current[category.id] = el;
            }}
            className="scroll-mt-24"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold sm:text-3xl">{category.title}</h2>
              <p className="mt-1 text-sm text-gray-400 sm:text-base">{category.subtitle}</p>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              <article className="flex h-52 w-[280px] flex-none flex-col justify-between rounded-xl border border-white/15 bg-gradient-to-br from-rose-200/10 via-pink-200/[0.06] to-slate-100/[0.04] p-5 shadow-[0_16px_44px_-32px_rgba(244,114,182,0.75)] backdrop-blur-xl sm:h-64 sm:min-w-[320px] sm:p-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300/90">
                    Project Summary
                  </p>
                  <h3 className="mt-3 text-lg font-semibold leading-snug text-rose-100 sm:text-xl">
                    {category.summaryHeading}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-100/80">
                    {category.summary}
                  </p>
                </div>
                <div className="mt-4 h-px w-16 bg-gradient-to-r from-rose-300/60 to-transparent" />
              </article>
              {category.images.map((src, index) => (
                <button
                  key={src}
                  onClick={() => openPreview(category.images, index)}
                  className="relative h-52 min-w-[240px] flex-none overflow-hidden rounded-xl border border-rose-300/20 bg-gray-900/60 sm:h-64 sm:min-w-[320px]"
                >
                  <Image
                    src={src}
                    alt={`${category.title} image ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 240px, 320px"
                    priority={index === 0}
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={slideIndex}
        plugins={[Thumbnails, Zoom]}
        thumbnails={{ position: "bottom", width: 90, height: 58, border: 0 }}
        zoom={{
          maxZoomPixelRatio: 4,
          zoomInMultiplier: 2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          doubleClickMaxStops: 2,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          scrollToZoom: true,
        }}
      />
    </section>
  );
}
