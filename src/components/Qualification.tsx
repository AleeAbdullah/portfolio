"use client";
import { useEffect } from "react";
import { InfoTooltip } from "./InfoTooltip";

declare global {
  interface Window {
    particlesJS: any;
    pJSDom?: any[];
  }
}

const education = [
  {
    institute: "FAST-NUCES, Lahore",
    degree: "Bachelor of Science in Computer Science",
    duration: "2021 - 2025",
  },
  {
    institute: "FCC",
    degree: "FSC Pre-Engineering",
    duration: "2019 - 2021",
  },
];

const experience = [
  {
    company: "Ripeseed.io",
    role: "Graphic Designer",
    duration: "Feb 2025 - Present",
    tooltip:
      "Designed pitch decks, social media creatives, and branded merchandise. Worked closely with developers and cross-functional teams to maintain visual consistency and deliver one to two polished branded posts each week.",
  },
  {
    company: "Scoopcodes",
    role: "Graphic Designer & Content Strategist",
    duration: "Aug 2025 - Jan 2026",
    tooltip:
      "Created social posts, event graphics, and LinkedIn content aligned with brand direction. Designed logos, shaped visual identity, and planned campaign content strategies with the team for consistent, on-brand delivery.",
  },
  {
    company: "GreatTemplatesArt",
    role: "Graphic Designer",
    duration: "Feb 2023 - Mar 2025",
    tooltip:
      "Produced 60+ stream overlay packages, including frames, alerts, and AI-assisted backgrounds. Built strong Illustrator expertise and designed Etsy listing graphics and mockups to improve product visibility and sales performance.",
  },
  // {
  //   company: "NUCES Fun Trekkers",
  //   role: "Graphic Designer",
  //   duration: "Aug 2025 - Jan 2026",
  //   tooltip:
  //     "Served as society designer for posters and promotional assets across events, fundraisers, and trips. Delivered eye-catching visuals that increased participation while keeping branding consistent across student-facing channels.",
  // },
  {
    company: "Freelance",
    role: "Graphic Designer",
    duration: "Aug 2025 - Present",
    tooltip:
      "Delivered custom Twitch overlays and social media designs for diverse client brands. Managed multiple projects in parallel, adapted to style guidelines quickly, and consistently shipped polished work on schedule.",
  },
];

const Qualification = () => {
  useEffect(() => {
    const initParticles = () => {
      if (!window.particlesJS) return;
      const container = document.getElementById("particles-qualification");
      if (!container) return;

      container.innerHTML = "";
      window.particlesJS("particles-qualification", {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: "rgb(225, 29, 72)" },
          shape: { type: "circle" },
          opacity: { value: 0.65, random: true },
          size: { value: 4, random: true },
          line_linked: {
            enable: true,
            distance: 150,
            color: "rgb(251, 113, 133)",
            opacity: 0.45,
            width: 1,
          },
          move: {
            enable: true,
            speed: 3,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false,
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: { enable: true, mode: "repulse" },
            resize: true,
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
          },
        },
        retina_detect: true,
      });
    };

    let script: HTMLScriptElement | null = null;

    if (window.particlesJS) {
      initParticles();
    } else {
      script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
      script.async = true;
      script.onload = initParticles;
      document.body.appendChild(script);
    }

    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (window.pJSDom && window.pJSDom.length > 0) {
        const instance = window.pJSDom[window.pJSDom.length - 1];
        instance?.pJS?.fn?.vendors?.destroypJS?.();
        window.pJSDom = [];
      }
    };
  }, []);

  return (
    <section
      className="relative overflow-hidden py-24"
      id="qualification"
    >
      <div
        id="particles-qualification"
        className="pointer-events-none absolute inset-0 z-0"
      ></div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="relative mb-16 text-center">
          <h2 className="mt-3 text-4xl font-bold text-gray-100">Qualifications</h2>
          <p className="mt-2 text-center text-rose-500">My Personal Journey</p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <h3 className="mb-8 flex items-center justify-center text-2xl font-medium text-gray-100 md:justify-start">
              <i className="uil uil-graduation-cap mr-3 text-3xl text-rose-600"></i>
              Education
            </h3>
            <div className="relative border-l-2 border-gray-800 pl-7">
              {education.map((item) => (
                <div key={item.institute} className="relative mb-10 last:mb-0">
                  <div className="absolute -left-[38px] top-1 h-5 w-5 rounded-full border-2 border-rose-600 bg-gray-900"></div>
                  <h4 className="mb-1 text-lg font-semibold text-gray-100">
                    {item.institute}
                  </h4>
                  <p className="mb-3 text-sm text-gray-400">{item.degree}</p>
                  <span className="flex items-center gap-x-2 text-sm text-rose-500">
                    <i className="uil uil-calendar-alt"></i>
                    {item.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-8 flex items-center justify-center text-2xl font-medium text-gray-100 md:justify-start">
              <i className="uil uil-suitcase mr-3 text-3xl text-rose-600"></i>
              Experience
            </h3>
            <div className="relative border-l-2 border-gray-800 pl-7">
              {experience.map((item) => (
                <div key={`${item.company}-${item.duration}`} className="relative mb-10 last:mb-0">
                  <div className="absolute -left-[38px] top-1 h-5 w-5 rounded-full border-2 border-rose-600 bg-gray-900"></div>
                  <h4 className="mb-1 text-lg font-semibold text-gray-100">
                    {item.company}
                  </h4>
                  <p className="mb-3 inline-flex items-center gap-2 text-sm text-gray-400">
                    {item.role}
                    <InfoTooltip
                      content={item.tooltip}
                      className="h-3.5 w-3.5 text-gray-500"
                    />
                  </p>
                  <span className="flex items-center gap-x-2 text-sm text-rose-500">
                    <i className="uil uil-calendar-alt"></i>
                    {item.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Qualification;
