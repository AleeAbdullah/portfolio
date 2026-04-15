"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import { PortfolioGallery as HeroPortfolioGallery } from "@/components/ui/portfolio-gallery";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

type GalleryCategory = {
  id: string;
  title: string;
  subtitle: string;
  images: string[];
};

const categories: GalleryCategory[] = [
  {
    id: "app-web-design",
    title: "App and Web Design",
    subtitle: "Product, UI, and branding visuals across web and mobile",
    images: [
      "/portfolio-images/mockups/seasons.webp",
      "/portfolio-images/mockups/safe%20buy.webp",
      "/portfolio-images/mockups/fitkraft.webp",
      "/portfolio-images/mockups/simplfly.webp",
      "/portfolio-images/mockups/simplfly%201.webp",
      "/portfolio-images/mockups/simplfly%202.webp",
      "/portfolio-images/mockups/simplfly%203.webp",
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
    images: [
      "/portfolio-images/great-templates-art/twitch-overlay/layout-1.png",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-2.png",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-3.png",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-4.png",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-5.png",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-6.png",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-8.png",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-9.png",
      "/portfolio-images/great-templates-art/twitch-overlay/layout-10.png",
    ],
  },
  {
    id: "ripe-seed",
    title: "Ripe Seed",
    subtitle: "Brand communication and campaign creatives",
    images: [
      "/portfolio-images/ripeseed/1.1.jpeg",
      "/portfolio-images/ripeseed/1.2.jpeg",
      "/portfolio-images/ripeseed/1.3.jpeg",
      "/portfolio-images/ripeseed/1.4.jpeg",
      "/portfolio-images/ripeseed/2.1.jpeg",
      "/portfolio-images/ripeseed/2.2.jpeg",
      "/portfolio-images/ripeseed/2.3.jpeg",
      "/portfolio-images/ripeseed/3.1.jpeg",
    ],
  },
  {
    id: "scoop-codes",
    title: "Scoop Codes",
    subtitle: "Social content direction and brand consistency",
    images: [
      "/portfolio-images/scoopcodes/carousal-1.png",
      "/portfolio-images/scoopcodes/carousal-2.png",
      "/portfolio-images/scoopcodes/carousal-3.png",
      "/portfolio-images/scoopcodes/carousal-4.png",
      "/portfolio-images/scoopcodes/carousal-5.png",
      "/portfolio-images/scoopcodes/carousal-6.png",
      "/portfolio-images/scoopcodes/1.png",
      "/portfolio-images/scoopcodes/2.png",
      "/portfolio-images/scoopcodes/3.png",
      "/portfolio-images/scoopcodes/4.png",
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
    src: "/portfolio-images/great-templates-art/twitch-overlay/layout-1.png",
    alt: "The Great Templates Art preview",
    categoryId: "great-templates-art",
  },
  {
    src: "/portfolio-images/great-templates-art/twitch-overlay/layout-8.png",
    alt: "The Great Templates Art preview",
    categoryId: "great-templates-art",
  },
  {
    src: "/portfolio-images/ripeseed/1.1.jpeg",
    alt: "Ripe Seed preview",
    categoryId: "ripe-seed",
  },
  {
    src: "/portfolio-images/ripeseed/2.3.jpeg",
    alt: "Ripe Seed preview",
    categoryId: "ripe-seed",
  },
  {
    src: "/portfolio-images/scoopcodes/1.png",
    alt: "Scoop Codes preview",
    categoryId: "scoop-codes",
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
      <div className="relative min-h-screen overflow-hidden px-6 pb-10 pt-12">
        <HeroPortfolioGallery
          title="Portfolio Gallery"
          archiveButton={{ text: "Browse Categories", href: "#app-web-design" }}
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

      <div className="mx-auto w-full max-w-7xl space-y-16 px-6 pb-24">
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
              <h2 className="text-3xl font-semibold">{category.title}</h2>
              <p className="mt-1 text-gray-400">{category.subtitle}</p>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {category.images.map((src, index) => (
                <button
                  key={src}
                  onClick={() => openPreview(category.images, index)}
                  className="relative h-64 min-w-[320px] flex-none overflow-hidden rounded-xl border border-rose-300/20 bg-gray-900/60"
                >
                  <Image
                    src={src}
                    alt={`${category.title} image ${index + 1}`}
                    fill
                    sizes="320px"
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
        plugins={[Thumbnails]}
        thumbnails={{ position: "bottom", width: 90, height: 58, border: 0 }}
      />
    </section>
  );
}
