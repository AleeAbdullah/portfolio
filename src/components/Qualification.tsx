"use client";
import { useEffect } from "react";

// Define particles.js types on the window object for TypeScript
declare global {
  interface Window {
    particlesJS: any;
    pJSDom?: any[];
  }
}

const Qualification = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
    script.async = true;

    script.onload = () => {
      if (window.particlesJS) {
        window.particlesJS("particles-qualification", {
          particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#e11d48" }, // Rose color for particles
            shape: { type: "circle" },
            opacity: { value: 0.4, random: true },
            size: { value: 3, random: true },
            line_linked: {
              enable: true,
              distance: 150,
              color: "#ed4e71",
              opacity: 0.2,
              width: 1,
            },
            move: {
              enable: true,
              speed: 3,
              direction: "none",
              random: false,
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
      }
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
      }
    };
  }, []);

  return (
    <section
      className="py-24 bg-gray-950 relative overflow-hidden"
      id="qualification"
    >
      {/* Particles container - z-0 and pointer-events-none are key */}
      <div id="particles-qualification" className="absolute inset-0 z-0 "></div>

      {/* Content Container */}
      <div className="container mx-auto px-6 relative z-10 pointer-events-none">
        <div className="relative mb-16 text-center">
          <h2 className="text-4xl font-bold text-gray-100">Qualifications</h2>
          <p className="text-center text-rose-500 mt-2">My Personal Journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Education Column */}
          <div>
            <h3 className="text-2xl font-medium mb-8 text-gray-100 flex items-center justify-center md:justify-start">
              <i className="uil uil-graduation-cap mr-3 text-rose-600 text-3xl"></i>
              Education
            </h3>
            <div className="relative border-l-2 border-gray-800 pl-10">
              <div className="relative mb-10">
                <div className="absolute -left-[51px] top-1 h-5 w-5 border-2 border-rose-600 rounded-full bg-gray-900"></div>
                <h3 className="text-lg font-semibold mb-1 text-gray-100">
                  FAST-NUCES, Lahore
                </h3>
                <p className="text-md mb-3 text-gray-400">BS Computer Science</p>
                <span className="flex items-center gap-x-2 text-sm text-rose-500">
                  <i className="uil uil-calendar-alt"></i>2018 - 2022
                </span>
              </div>
              <div className="relative">
                <div className="absolute -left-[51px] top-1 h-5 w-5 border-2 border-rose-600 rounded-full bg-gray-900"></div>
                <h3 className="text-lg font-semibold mb-1 text-gray-100">
                  FCC
                </h3>
                <p className="text-md mb-3 text-gray-400">
                  FSC Pre Engineering
                </p>
                <span className="flex items-center gap-x-2 text-sm text-rose-500">
                  <i className="uil uil-calendar-alt"></i>2016 - 2018
                </span>
              </div>
            </div>
          </div>

          {/* Experience Column */}
          <div>
            <h3 className="text-2xl font-medium mb-8 text-gray-100 flex items-center justify-center md:justify-start">
              <i className="uil uil-suitcase mr-3 text-rose-600 text-3xl"></i>
              Experience
            </h3>
            <div className="relative border-l-2 border-gray-800 pl-10">
              <div className="relative mb-10">
                <div className="absolute -left-[51px] top-1 h-5 w-5 border-2 border-rose-600 rounded-full bg-gray-900"></div>
                <h3 className="text-lg font-semibold mb-1 text-gray-100">
                  Ripeseed.io
                </h3>
                <p className="text-md mb-3 text-gray-400">Software Engineer</p>
                <p className="text-sm mb-3 text-gray-400">Faisal Town, Lahore, Pakistan</p>
                <span className="flex items-center gap-x-2 text-sm text-rose-500">
                  <i className="uil uil-calendar-alt"></i>Aug 2025 - Present
                </span>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  Building a Django and Next.js roofing platform for distributors,
                  contractors, and customers. Automated measurements cut material
                  estimates from three days to about seven minutes and improved
                  quoting efficiency by 90%.
                </p>
              </div>
              <div className="relative mb-10">
                <div className="absolute -left-[51px] top-1 h-5 w-5 border-2 border-rose-600 rounded-full bg-gray-900"></div>
                <h3 className="text-lg font-semibold mb-1 text-gray-100">
                  Tech Grus
                </h3>
                <p className="text-md mb-3 text-gray-400">Software Engineer · Remote</p>
                <span className="flex items-center gap-x-2 text-sm text-rose-500">
                  <i className="uil uil-calendar-alt"></i>Feb 2024 - Jul 2025
                </span>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  Built Next.js and NestJS restaurant platforms for two brands,
                  with PWAs, payments, dashboards, and loyalty features that
                  helped raise repeat orders by 25%.
                </p>
              </div>
              <div className="relative">
                <div className="absolute -left-[51px] top-1 h-5 w-5 border-2 border-rose-600 rounded-full bg-gray-900"></div>
                <h3 className="text-lg font-semibold mb-1 text-gray-100">
                  Upwork
                </h3>
                <p className="text-md mb-3 text-gray-400">Freelance Software Developer · Remote</p>
                <span className="flex items-center gap-x-2 text-sm text-rose-500">
                  <i className="uil uil-calendar-alt"></i>2021 - 2024
                </span>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  Shipped client web and mobile apps using React, Next.js, React
                  Native, Node.js, Firebase, and Supabase, from interface work
                  through backend integration and deployment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Qualification;
