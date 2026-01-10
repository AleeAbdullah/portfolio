"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleX,
  MonitorDot,
  TabletSmartphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { cn } from "../lib/utils";

const projects = [
  {
    title: "Seasons Reastaurant Site",
    category: "web",
    description:
      "a comprehensive, end-to-end web platform designed to empower restaurant owners to build a powerful online presence, streamline operations, and foster customer loyalty. This bespoke solution provides a feature-rich admin dashboard for restaurant management and a seamless, modern storefront for customers to engage with the brand.",
    details: [
      { label: "Platform", value: "Web" },
      { label: "Role", value: "sole Full Stack Developer" },
    ],
    techStack: ["Next.js", "Tailwind CSS", "TypeScript", "Firebase", "Rive"],
    features: [
      "PWA with offline support",
      "Push notifications for customer engagement",
      "Dynamic Site & Content Management",
      "Advanced Menu Creator",
      "Integrated SEO Blog Engine",
      "User & Role Management",
    ],
    images: ["/mockups/seasons.webp"],
    github: null,
    live: "https://seasonseateryhi.com",
  },
  {
    title: "Safe Buy Africa",
    category: "app",
    description:
      "A production-grade, multi-vendor marketplace mobile app for Android & iOS with distinct customer and seller portals.",
    details: [
      { label: "Platform", value: "Android & iOS" },
      { label: "Role", value: "Full Stack Developer" },
    ],
    techStack: [
      "React Native",
      "Expo",
      "TypeScript",
      "Firebase",
      "Supabase",
      "Paystack",
    ],
    features: [
      "Secure user identity and real-time data sync",
      "Efficient full-text search and product catalog",
      "Robust cart total verification via Cloud Functions",
      "Seamless multi-seller split payments",
    ],
    images: ["/mockups/safe buy.webp"],
    github: null,
    live: "dashboard.safebuy.africa",
  },
  {
    title: "FitKraft",
    category: "app",
    description:
      "A health and fitness mobile app that uses AI to generate personalized workout and meal plans based on user BMI.",
    details: [
      { label: "Platform", value: "Android" },
      { label: "Role", value: "Frontend Developer" },
    ],
    techStack: [
      "React Native",
      "Expo",
      "Node.js",
      "Express.js",
      "MongoDB",
      "React Native Reanimated",
    ],
    features: [
      "AI-driven personalized workout & meal plans",
      "Engaging UI with fluid animations",
      "Secure data encryption and session management",
      "Seamless API integration for content delivery",
    ],
    images: ["/mockups/fitkraft.webp"],
    github: "https://github.com/AleeAbdullah/fitkraft",
    live: null,
  },
  {
    title: "Knowledge Quran",
    category: "app",
    description:
      "A comprehensive cross-platform Learning Management Portal for students, teachers, and admins.",
    details: [
      { label: "Platform", value: "Android & iOS" },
      { label: "Role", value: "Frontend Developer" },
    ],
    techStack: ["React Native", "Expo", "WebRTC", "Firebase", "Jitsi SDK"],
    features: [
      "Real-time peer-to-peer video conferencing",
      "Role-based access for students, teachers, & admins",
      "Account management and progress tracking",
      "Interactive online learning sessions",
    ],
    images: [
      "/mockups/Knowlegge Quran.webp",
      "/mockups/Knowlegge Quran 2.webp",
      "/mockups/Knowlegge Quran 3.webp",
    ],
    github: "https://github.com/AleeAbdullah/knowlegequran-Expo-App",
    live: null,
  },
  {
    title: "Simplifly",
    category: "web",
    description:
      "A dual-portal web platform designed to simplify booking and managing flights for travelers and flight sellers.",
    details: [
      { label: "Platform", value: "Web" },
      { label: "Role", value: "Full Stack Developer" },
    ],
    techStack: ["React.js", "Node.js", "Express.js", "MongoDB", "TypeScript"],
    features: [
      "Real-time flight search and price comparison",
      "Secure booking and payment management",
      "Automated email notifications",
      "Comprehensive admin dashboard for sellers",
    ],
    images: [
      "/mockups/simplfly.webp",
      "/mockups/simplfly 1.webp",
      "/mockups/simplfly 2.webp",
      "/mockups/simplfly 3.webp",
    ],
    github: "https://github.com/ye-bhee-theek-ha/Simplify",
    live: "https://simplifly.scoopcodes.com/",
  },
];

const categories = ["all", "app", "web"];

const Projects = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const filteredProjects =
    selectedCategory === "all"
      ? projects
      : projects.filter((p) => p.category === selectedCategory);

  const openModal = (project: any) => {
    setSelectedProject(project);
    setCurrentImageIndex(0);
  };
  const closeModal = () => {
    setSelectedProject(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedProject?.images) {
      setCurrentImageIndex(
        (prev) => (prev + 1) % selectedProject.images.length
      );
    }
  };

  const prevImage = () => {
    if (selectedProject?.images) {
      setCurrentImageIndex(
        (prev) =>
          (prev - 1 + selectedProject.images.length) %
          selectedProject.images.length
      );
    }
  };

  return (
    <section
      className={cn("py-24 transition-colors duration-300", "bg-background")}
      id="work"
    >
      <div className="container mx-auto px-6">
        <motion.div
          className="relative mb-16 text-center"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          viewport={{ once: true }}
        >
          <h2
            className={cn(
              "text-4xl font-bold transition-colors duration-300",
              "text-foreground"
            )}
          >
            Recent Works
          </h2>
          <p
            className={cn(
              "text-center mt-2 transition-colors duration-300",
              "text-primary"
            )}
          >
            My Portfolio
          </p>
        </motion.div>

        <motion.div
          className="flex justify-center mb-12 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          viewport={{ once: true }}
        >
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.title}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.2,
                delay: index * 0.02,
              }}
              className={cn(
                "group relative rounded-xl overflow-hidden cursor-pointer shadow-lg transition-all duration-300 flex flex-col",
                "bg-card border border-border hover:shadow-primary/20"
              )}
              onClick={() => openModal(project)}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center h-48 overflow-hidden transition-colors duration-300",
                  "bg-muted group-hover:bg-primary/10"
                )}
              >
                {project.images && project.images[0] ? (
                  <Image
                    src={project.images[0]}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : project.category === "app" ? (
                  <TabletSmartphone
                    className={cn(
                      "text-7xl group-hover:scale-110 transition-all duration-300",
                      "text-muted-foreground group-hover:text-primary"
                    )}
                  />
                ) : (
                  <MonitorDot
                    className={cn(
                      "text-7xl group-hover:scale-110 transition-all duration-300",
                      "text-muted-foreground group-hover:text-primary"
                    )}
                  />
                )}
              </div>
              <div className="p-6 grow flex flex-col">
                <h3
                  className={cn(
                    "text-xl font-bold mb-2 truncate transition-colors duration-300",
                    "text-card-foreground"
                  )}
                >
                  {project.title}
                </h3>
                <p
                  className={cn(
                    "text-sm mb-4 line-clamp-3 grow transition-colors duration-300",
                    "text-muted-foreground"
                  )}
                >
                  {project.description}
                </p>
                <span
                  className={cn(
                    "text-sm font-semibold mt-auto group-hover:underline transition-colors duration-300",
                    "text-primary"
                  )}
                >
                  View Details
                  <i className="uil uil-arrow-right transform transition-transform duration-300 group-hover:translate-x-1"></i>
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className={cn(
                "w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300",
                "bg-card border border-border"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 relative overflow-y-auto max-h-[90vh]">
                <button
                  onClick={closeModal}
                  className={cn(
                    "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-20",
                    "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  <CircleX size={20} />
                </button>

                {/* Image Gallery */}
                {selectedProject.images &&
                  selectedProject.images.length > 0 && (
                    <div className="relative mb-6 rounded-lg overflow-hidden bg-muted aspect-video">
                      <Image
                        src={selectedProject.images[currentImageIndex]}
                        alt={`${selectedProject.title} - Image ${
                          currentImageIndex + 1
                        }`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 768px"
                      />
                      {selectedProject.images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage();
                            }}
                            className={cn(
                              "absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10",
                              "bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                            )}
                            aria-label="Previous image"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage();
                            }}
                            className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10",
                              "bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                            )}
                            aria-label="Next image"
                          >
                            <ChevronRight size={20} />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {selectedProject.images.map(
                              (_: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex(index);
                                  }}
                                  className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    currentImageIndex === index
                                      ? "bg-primary w-6"
                                      : "bg-white/50 hover:bg-white/70"
                                  )}
                                  aria-label={`Go to image ${index + 1}`}
                                />
                              )
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                <h2
                  className={cn(
                    "text-3xl font-bold mb-2 transition-colors duration-300",
                    "text-card-foreground"
                  )}
                >
                  {selectedProject.title}
                </h2>
                <p
                  className={cn(
                    "mb-6 text-sm transition-colors duration-300",
                    "text-muted-foreground"
                  )}
                >
                  {selectedProject.description}
                </p>

                <div className="space-y-6">
                  <div>
                    <h4
                      className={cn(
                        "font-semibold mb-3 border-b pb-2 transition-colors duration-300",
                        "text-card-foreground border-border"
                      )}
                    >
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {selectedProject.features.map((feature: string) => (
                        <li
                          key={feature}
                          className={cn(
                            "flex items-start gap-3 text-sm transition-colors duration-300",
                            "text-muted-foreground"
                          )}
                        >
                          <i
                            className={cn(
                              "uil uil-check-circle mt-1",
                              "text-primary"
                            )}
                          ></i>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4
                      className={cn(
                        "font-semibold mb-3 border-b pb-2 transition-colors duration-300",
                        "text-card-foreground border-border"
                      )}
                    >
                      Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.techStack.map((tech: string) => (
                        <span
                          key={tech}
                          className={cn(
                            "text-xs font-medium px-3 py-1 rounded-full border transition-colors duration-300",
                            "bg-secondary text-secondary-foreground border-border"
                          )}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <h4
                      className={cn(
                        "font-semibold mt-6 mb-3 border-b pb-2 transition-colors duration-300",
                        "text-card-foreground border-border"
                      )}
                    >
                      Role & Platform
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedProject.details.map((detail: any) => (
                        <div
                          key={detail.label}
                          className="flex justify-between"
                        >
                          <span
                            className={cn(
                              "transition-colors duration-300",
                              "text-muted-foreground"
                            )}
                          >
                            {detail.label}:
                          </span>
                          <span
                            className={cn(
                              "font-medium transition-colors duration-300",
                              "text-card-foreground"
                            )}
                          >
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t transition-colors duration-300",
                    "border-border"
                  )}
                >
                  {selectedProject.live && (
                    <a
                      href={selectedProject.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex-1 py-3 px-6 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-md",
                        "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
                      )}
                    >
                      <i className="uil uil-external-link-alt"></i>
                      Go to Project
                    </a>
                  )}

                  {selectedProject.github && (
                    <a
                      href={selectedProject.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex-1 py-3 px-6 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95",
                        "bg-secondary text-secondary-foreground hover:bg-accent border border-border"
                      )}
                    >
                      <i className="uil uil-github"></i>
                      View on GitHub
                    </a>
                  )}

                  {!selectedProject.live && !selectedProject.github && (
                    <div
                      className={cn(
                        "flex-1 py-3 px-6 rounded-lg text-center text-sm",
                        "text-muted-foreground bg-muted/50"
                      )}
                    >
                      Links coming soon
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Projects;
