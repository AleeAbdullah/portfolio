//src/Components/Hero.ts
import localFont from "next/font/local";
import { Badge } from "@/components/ui/badge";
import { ShaderAnimation } from "../../components/ui/shader-animation";
import { ArrowDown } from "lucide-react";

const preahvihear = localFont({
  src: "../../public/fonts/Preahvihear-Regular.ttf",
  display: "swap",
});

const HERO_EMOJI_ASSET = "/Hero/person-emoji.svg";
const HERO_ARROW_ASSET = "/Hero/hero-arrow.svg";

const Hero = () => {
  return (
    <section
      className={`relative h-screen overflow-hidden ${preahvihear.className}`}
      id="home"
    >
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>
      <div className="absolute inset-0 z-10" />

      <div className="relative z-20 container mx-auto flex h-full items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <div className="flex flex-col items-center gap-6 md:mb-12 md:flex-row md:items-end md:justify-center md:gap-10 mb-28">
            <div className="relative">
              <div className="absolute inset-0 scale-125 rounded-full bg-rose-500/20 blur-2xl" />
              <div className="relative flex size-36 items-center justify-center rounded-full border border-rose-400/40 bg-gray-900/70 shadow-lg shadow-rose-500/20 md:size-44">
                <img
                  src={HERO_EMOJI_ASSET}
                  alt="Ali illustration"
                  className="h-28 w-28 object-contain md:h-36 md:w-36"
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
              <p className="mb-2 text-sm text-gray-200 md:text-base absolute left-18 -top-14 ">
                Hello! I Am <span className="text-rose-400">Ali Abdullah</span>
              </p>
              <p className="mb-2 text-sm text-gray-300 decoration-gray-300/70 underline-offset-4 md:text-base mt-4">
                A Designer who
              </p>
              <h2 className="mb-2 text-3xl leading-tight text-gray-100 md:text-5xl">
                Judges a book
                <br />
                by its <span className="text-rose-400">cover</span>...
              </h2>
              <p className="text-xs text-gray-400 md:text-sm">
                Because if the cover does not impress you what else can?
              </p>
            </div>
          </div>
          <div className="h-8" />

          <div className="items-left text-left">
            <h1 className="mb-4 text-7xl font-bold text-gray-100">
              Ali Abdullah
            </h1>
            <h1 className="mb-6 text-xl font-medium text-rose-400 md:text-2xl">
              Graphic Designer
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
              I design visual identities, social media campaigns, stream overlays,
              and digital assets that help brands stay consistent, memorable, and
              audience-focused.
            </p>
            <Badge
              variant="outline"
              className="mt-10 inline-flex items-center gap-2 rounded-full border-gray-500/60 bg-gray-900/40 px-4 py-2 text-sm font-medium uppercase tracking-[0.18em] text-gray-300"
            >
              <ArrowDown className="size-4" />
              Scroll to explore
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
