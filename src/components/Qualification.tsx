"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useThemeStore } from "../store/themeStore";
import { cn } from "../lib/utils";

// Define particles.js types on the window object for TypeScript
declare global {
  interface Window {
    particlesJS: any;
    pJSDom?: any[];
  }
}

const Qualification = () => {
  const { theme } = useThemeStore();

  const initParticles = () => {
    if (window.particlesJS) {
      const isDark = theme === "dark";
      // Destroy existing particles if any
      if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
      }
      
      window.particlesJS("particles-qualification", {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: isDark ? "#3b82f6" : "#64748b" }, // Blue for dark, grey for light
          shape: { type: "circle" },
          opacity: { value: 0.4, random: true },
          size: { value: 3, random: true },
          line_linked: {
            enable: true,
            distance: 150,
            color: isDark ? "#60a5fa" : "#94a3b8",
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

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
    script.async = true;

    script.onload = () => {
      initParticles();
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

  // Reinitialize particles when theme changes
  useEffect(() => {
    if (window.particlesJS) {
      initParticles();
    }
  }, [theme]);

  return (
    <section
      className={cn("py-24 relative overflow-hidden transition-colors duration-300", "bg-background")}
      id="qualification"
    >
      {/* Particles container - z-0 and pointer-events-none are key */}
      <div id="particles-qualification" className="absolute inset-0 z-0 "></div>

      {/* Content Container */}
      <div className="container mx-auto px-6 relative z-10 pointer-events-none">
        <motion.div
          className="relative mb-16 text-center"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          viewport={{ once: true }}
        >
          <h2 className={cn("text-4xl font-bold transition-colors duration-300", "text-foreground")}>Qualifications</h2>
          <p className={cn("text-center mt-2 transition-colors duration-300", "text-primary")}>My Personal Journey</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Education Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            viewport={{ once: true }}
          >
            <h3 className={cn("text-2xl font-medium mb-8 flex items-center justify-center md:justify-start transition-colors duration-300", "text-foreground")}>
              <i className={cn("uil uil-graduation-cap mr-3 text-3xl transition-colors duration-300", "text-primary")}></i>
              Education
            </h3>
            <div className={cn("relative border-l-2 pl-10 transition-colors duration-300", "border-border")}>
              <motion.div
                className="mb-10"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className={cn("absolute -left-[11px] top-1 h-5 w-5 border-2 rounded-full transition-colors duration-300", "border-primary bg-card")}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3, type: "spring" }}
                  viewport={{ once: true }}
                ></motion.div>
                <h3 className={cn("text-lg font-semibold mb-1 transition-colors duration-300", "text-foreground")}>
                  FAST-NUCES, Lahore
                </h3>
                <p className={cn("text-md mb-3 transition-colors duration-300", "text-muted-foreground")}>Undergrad BS(CS)</p>
                <span className={cn("flex items-center gap-x-2 text-sm transition-colors duration-300", "text-primary")}>
                  <i className="uil uil-calendar-alt"></i>2021 - 2025
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className={cn("absolute -left-[11px] top-1 h-5 w-5 border-2 rounded-full transition-colors duration-300", "border-primary bg-card")}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5, type: "spring" }}
                  viewport={{ once: true }}
                ></motion.div>
                <h3 className={cn("text-lg font-semibold mb-1 transition-colors duration-300", "text-foreground")}>
                  FCC
                </h3>
                <p className={cn("text-md mb-3 transition-colors duration-300", "text-muted-foreground")}>
                  FSC Pre Engineering
                </p>
                <span className={cn("flex items-center gap-x-2 text-sm transition-colors duration-300", "text-primary")}>
                  <i className="uil uil-calendar-alt"></i>2019 - 2021
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Experience Column */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            viewport={{ once: true }}
          >
            <h3 className={cn("text-2xl font-medium mb-8 flex items-center justify-center md:justify-start transition-colors duration-300", "text-foreground")}>
              <i className={cn("uil uil-suitcase mr-3 text-3xl transition-colors duration-300", "text-primary")}></i>
              Experience
            </h3>
            <div className={cn("relative border-l-2 pl-10 transition-colors duration-300", "border-border")}>
              <motion.div
                className="mb-10"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className={cn("absolute -left-[11px] top-1 h-5 w-5 border-2 rounded-full transition-colors duration-300", "border-primary bg-card")}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3, type: "spring" }}
                  viewport={{ once: true }}
                ></motion.div>
                <h3 className={cn("text-lg font-semibold mb-1 transition-colors duration-300", "text-foreground")}>
                  Tech Grus
                </h3>
                <p className={cn("text-md mb-3 transition-colors duration-300", "text-muted-foreground")}>Software Engineer</p>
                <span className={cn("flex items-center gap-x-2 text-sm transition-colors duration-300", "text-primary")}>
                  <i className="uil uil-calendar-alt"></i>Feb 2025 - Present
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className={cn("absolute -left-[11px] top-1 h-5 w-5 border-2 rounded-full transition-colors duration-300", "border-primary bg-card")}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5, type: "spring" }}
                  viewport={{ once: true }}
                ></motion.div>
                <h3 className={cn("text-lg font-semibold mb-1 transition-colors duration-300", "text-foreground")}>
                  724.One
                </h3>
                <p className={cn("text-md mb-3 transition-colors duration-300", "text-muted-foreground")}>
                  React Native Intern
                </p>
                <span className={cn("flex items-center gap-x-2 text-sm transition-colors duration-300", "text-primary")}>
                  <i className="uil uil-calendar-alt"></i>Sep 2023 - Jan 2024
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Qualification;
