"use client";

import {
  Building2,
  CodeXml,
  Facebook,
  Github,
  Instagram,
  Linkedin,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useScroll, useTransform } from "framer-motion";
import { cn } from "../lib/utils";

const Hero = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <section
      className={cn(
        "h-screen relative overflow-hidden pt-16 transition-colors duration-300 rounded-xl",
        "bg-background",
      )}
      id="home"
    >
      {/* Background Pattern and Effects */}
      <div className="absolute inset-0 z-0">
        {/* Base Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>

        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] rounded-xl overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>

        {/* Animated Blob Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] rounded-xl overflow-hidden"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      <div className="container mx-auto px-6 relative h-full flex items-center z-10">
        <motion.div
          className="absolute top-20 left-6 flex items-center gap-x-18 z-20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span
            className={cn(
              "font-medium relative after:content-[''] after:absolute after:w-12 after:h-0.5 after:right-[-4rem] after:top-1/2 transition-colors duration-300",
              "text-muted-foreground after:bg-border",
            )}
          >
            Follow Me
          </span>
          <div className="inline-flex gap-x-4">
            <a
              href="https://www.github.com/AleeAbdullah"
              target="_blank"
              className={cn(
                "text-lg transition-all duration-300 hover:-translate-y-1 hover:scale-110",
                "text-muted-foreground hover:text-primary",
              )}
            >
              <Github />
            </a>
            <a
              href="https://www.linkedin.com/in/ali-abdullah-854716224"
              target="_blank"
              className={cn(
                "text-lg transition-all duration-300 hover:-translate-y-1 hover:scale-110",
                "text-muted-foreground hover:text-primary",
              )}
            >
              <Linkedin />
            </a>
            <a
              href="https://scoopcodes.com/"
              target="_blank"
              className={cn(
                "text-lg transition-all duration-300 hover:-translate-y-1 hover:scale-110",
                "text-muted-foreground hover:text-primary",
              )}
            >
              <CodeXml />
            </a>
            <a
              href="https://www.instagram.com/aliabdullah82"
              target="_blank"
              className={cn(
                "text-lg transition-all duration-300 hover:-translate-y-1 hover:scale-110",
                "text-muted-foreground hover:text-primary",
              )}
            >
              <Instagram />
            </a>
          </div>
        </motion.div>

        <motion.div
          style={{ y, opacity }}
          initial={{ opacity: 0, scale: 0.8, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block absolute right-20 bottom-0 z-20"
        >
          <Image
            src="/22.jpg"
            width={500}
            height={800}
            alt="Ali"
            className="object-cover rounded-t-full shadow-2xl"
          />
        </motion.div>

        <motion.div
          className="relative z-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={itemVariants}
            className={cn(
              "text-5xl md:text-6xl font-bold mb-4 transition-colors duration-300",
              "text-foreground",
            )}
          >
            Hi, I'm Ali Abdullah
          </motion.h1>
          <motion.h3
            variants={itemVariants}
            className={cn(
              "text-xl md:text-2xl font-medium mb-4 transition-colors duration-300",
              "text-primary",
            )}
          >
            Full Stack Developer
          </motion.h3>
          <motion.p
            variants={itemVariants}
            className={cn(
              "max-w-md mb-8 leading-relaxed transition-colors duration-300",
              "text-muted-foreground",
            )}
          >
            I'm a full stack software developer, with extensive knowledge and
            years of experience, working with quality work in web and app
            technologies.
          </motion.p>
          <motion.a
            variants={itemVariants}
            href="#about"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium relative z-10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:opacity-90",
              "bg-primary text-primary-foreground",
            )}
          >
            <i className="uil uil-user"></i>
            More About me!
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
