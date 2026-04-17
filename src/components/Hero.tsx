//src/Components/Hero.ts
import localFont from "next/font/local";
import { Badge } from "@/components/ui/badge";
import { ShaderAnimation } from "../../components/ui/shader-animation";
import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";

const preahvihear = localFont({
  src: "../../public/fonts/Preahvihear-Regular.ttf",
  display: "swap",
});

const HERO_EMOJI_ASSET = "/hero/person-emoji.svg";
const HERO_ARROW_ASSET = "/hero/hero-arrow.svg";

const Hero = () => {
  return (
    <section
      className={`relative min-h-screen overflow-hidden ${preahvihear.className}`}
      id="home"
    >
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>
      <div className="absolute inset-0 z-10" />

      <div className="relative z-20 container mx-auto flex min-h-screen items-center justify-center px-4 pt-16 sm:px-6">
        <div className="max-w-5xl text-center">
          <div className="mb-16 flex flex-col items-center gap-6 md:mb-12 md:flex-row md:items-end md:justify-center md:gap-10">
            <div className="relative">
              <div className="absolute inset-0 scale-125 rounded-full bg-rose-500/20 blur-2xl" />
              <div className="relative flex size-28 items-center justify-center rounded-full border border-rose-400/40 bg-gray-900/70 shadow-lg shadow-rose-500/20 sm:size-36 md:size-44">
                <img
                  src={HERO_EMOJI_ASSET}
                  alt="Ali illustration"
                  className="h-24 w-24 object-contain sm:h-28 sm:w-28 md:h-36 md:w-36"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>

            <div className="relative text-center md:text-left">
              <img
                src={HERO_ARROW_ASSET}
                alt=""
                aria-hidden="true"
                className="absolute -left-24 -top-26 hidden w-48 opacity-80 md:block"
              />
              <p className="mb-2 text-sm text-gray-200 md:text-base md:absolute md:left-18 md:-top-14">
                Hello! I Am <span className="text-rose-400">Ali Abdullah</span>
              </p>
              <p className="mb-2 mt-2 text-sm text-gray-300 decoration-gray-300/70 underline-offset-4 md:mt-4 md:text-base">
                A Designer who
              </p>
              <h2 className="mb-2 text-2xl leading-tight text-gray-100 sm:text-3xl md:text-5xl">
                Judges a book
                <br />
                by its <span className="text-rose-400">cover</span>...
              </h2>
              <p className="text-xs text-gray-400 md:text-sm">
                Because if the cover does not impress you what else can?
              </p>
            </div>
          </div>
          <div className="h-4 md:h-8" />

          <div className="items-left text-left">
            <h1 className="mb-4 text-4xl font-bold text-gray-100 sm:text-5xl md:text-7xl">
              Ali Abdullah
            </h1>
            <h1 className="mb-6 text-lg font-medium text-rose-400 sm:text-xl md:text-2xl">
              Graphic Designer
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base md:text-lg">
              I design visual identities, social media campaigns, stream overlays,
              and digital assets that help brands stay consistent, memorable, and
              audience-focused.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="inline-flex items-center gap-2 rounded-full border-gray-500/60 bg-gray-900/40 px-4 py-2 text-sm font-medium uppercase tracking-[0.18em] text-gray-300"
              >
                <ArrowDown className="size-4" />
                Scroll to explore
              </Badge>
              <Link
                href="/work"
                className="inline-flex items-center gap-2 rounded-full border border-gray-500/60 bg-gray-900/40 px-4 py-2 text-sm font-medium uppercase tracking-[0.18em] text-gray-300 transition-colors hover:border-gray-300/60 hover:text-gray-100"
              >
                Show all
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
