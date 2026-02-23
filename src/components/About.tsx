"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "../lib/utils";

// A reusable component for the animated statistic cards
const StatCard = ({
  icon,
  value,
  label,
  isPlus = false,
}: {
  icon: string;
  value: number;
  label: string;
  isPlus?: boolean;
}) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: true, // Only trigger animation once
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const end = value;
      if (start === end) return;

      const duration = 2000; // 2 seconds
      const incrementTime = duration / end;

      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) {
          clearInterval(timer);
        }
      }, incrementTime);
    }
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      className={cn("text-center rounded-lg p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20", "bg-card border border-border hover:border-primary/50")}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      viewport={{ once: true }}
    >
      <i className={cn(`${icon} text-4xl mb-3 transition-colors duration-300`, "text-primary")}></i>
      <h3 className={cn("text-3xl font-bold transition-colors duration-300", "text-card-foreground")}>
        {count}
        {isPlus ? "+" : ""}
      </h3>
      <span className={cn("text-sm transition-colors duration-300", "text-muted-foreground")}>{label}</span>
    </motion.div>
  );
};

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <section className={cn("py-24 overflow-hidden transition-colors duration-300", "bg-background")} id="about">
      <div className="container mx-auto px-6">
        <motion.div
          className="relative mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          viewport={{ once: true }}
        >
          <h2 className={cn("text-4xl font-bold text-center transition-colors duration-300", "text-foreground")}>
            About Me
          </h2>
          <p className={cn("text-center mt-2 transition-colors duration-300", "text-primary")}>My Introduction</p>
        </motion.div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            className={cn("mb-12 leading-relaxed text-lg transition-colors duration-300", "text-muted-foreground")}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
            viewport={{ once: true }}
          >
            I am a full stack software developer adept at building scalable APIs
            with Express and skilled in crafting intuitive UIs with React Native
            and Next.js. My passion lies in creating exceptional end-user
            experiences through clean code, responsive design, and robust
            backend architecture.
          </motion.p>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <StatCard
              icon="uil uil-award"
              value={2}
              label="Years of Experience"
              isPlus
            />
            <StatCard
              icon="uil uil-suitcase-alt"
              value={15}
              label="Projects Completed"
              isPlus
            />
            <StatCard
              icon="uil uil-headphones-alt"
              value={24}
              label="Hours of Support"
            />
          </motion.div>

          <motion.a
            href="#contact"
            className={cn("inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg active:scale-95", "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/30")}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className="uil uil-navigator"></i>
            Contact me
          </motion.a>
        </div>
      </div>
    </section>
  );
};

export default About;
