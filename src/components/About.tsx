"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

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
      className="text-center rounded-lg p-6 bg-gray-900 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-rose-600/20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <i className={`${icon} text-4xl text-rose-600 mb-3`}></i>
      <h3 className="text-3xl font-bold text-gray-100">
        {count}
        {isPlus ? "+" : ""}
      </h3>
      <span className="text-sm text-gray-400">{label}</span>
    </motion.div>
  );
};

const About = () => {
  return (
    <section className="py-24 bg-gray-950 overflow-hidden" id="about">
      <div className="container mx-auto px-6">
        <motion.div
          className="relative mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-gray-100 text-center">
            About Me
          </h2>
          <p className="text-center text-rose-500 mt-2">My Introduction</p>
        </motion.div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            className="text-gray-300 mb-12 leading-relaxed text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            I am a full stack software developer adept at building scalable APIs
            with Express and skilled in crafting intuitive UIs with React Native
            and Next.js. My passion lies in creating exceptional end-user
            experiences through clean code, responsive design, and robust
            backend architecture.
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
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
          </div>

          <motion.a
            href="#contact"
            className="inline-flex items-center gap-2 bg-rose-600 text-gray-100 px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:bg-rose-700 hover:scale-105 shadow-lg shadow-rose-600/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
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
