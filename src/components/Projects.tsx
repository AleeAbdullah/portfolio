"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleX, MonitorDot, TabletSmartphone } from "lucide-react";

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
    github: null,
    live: null,
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
    github: "https://github.com/ye-bhee-theek-ha/fitkraft",
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
    github: "https://github.com/ye-bhee-theek-ha/knowlegequran-Expo-App",
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
    github: "https://github.com/ye-bhee-theek-ha/Simplify",
    live: null,
  },
];

const categories = ["all", "app", "web"];

const Projects = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const filteredProjects =
    selectedCategory === "all"
      ? projects
      : projects.filter((p) => p.category === selectedCategory);

  const openModal = (project: any) => {
    setSelectedProject(project);
  };
  const closeModal = () => setSelectedProject(null);

  return (
    <section className="py-24 bg-gray-950" id="work">
      <div className="container mx-auto px-6">
        <div className="relative mb-16 text-center">
          <h2 className="text-4xl font-bold text-gray-100">Recent Works</h2>
          <p className="text-center text-rose-500 mt-2">My Portfolio</p>
        </div>

        <div className="flex justify-center mb-12 gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.title}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-gray-900 rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-rose-600/20 transition-shadow duration-300 flex flex-col"
                onClick={() => openModal(project)}
              >
                <div className="relative flex items-center justify-center h-48 bg-gray-800/50 group-hover:bg-rose-900/20 transition-colors duration-300">
                  {project.category === "app" ? (
                    <TabletSmartphone
                      className={`text-7xl text-gray-700 group-hover:text-rose-500 group-hover:scale-110 transition-all duration-300`}
                    />
                  ) : (
                    <MonitorDot
                      className={`text-7xl text-gray-700 group-hover:text-rose-500 group-hover:scale-110 transition-all duration-300`}
                    />
                  )}
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-gray-100 mb-2 truncate">
                    {project.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">
                    {project.description}
                  </p>
                  <span className="text-rose-500 text-sm font-semibold mt-auto group-hover:underline">
                    View Details
                    <i className="uil uil-arrow-right transform transition-transform duration-300 group-hover:translate-x-1"></i>
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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
              className="w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 relative overflow-y-auto max-h-[90vh]">
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-rose-600 transition-colors z-20"
                >
                  <CircleX />
                </button>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {selectedProject.title}
                </h2>
                <p className="text-gray-400 mb-6 text-sm">
                  {selectedProject.description}
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3 border-b border-gray-800 pb-2">
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {selectedProject.features.map((feature: string) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm text-gray-300"
                        >
                          <i className="uil uil-check-circle text-rose-500 mt-1"></i>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-3 border-b border-gray-800 pb-2">
                      Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.techStack.map((tech: string) => (
                        <span
                          key={tech}
                          className="bg-gray-800 text-gray-300 text-xs font-medium px-3 py-1 rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-semibold text-white mt-6 mb-3 border-b border-gray-800 pb-2">
                      Role & Platform
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedProject.details.map((detail: any) => (
                        <div
                          key={detail.label}
                          className="flex justify-between"
                        >
                          <span className="text-gray-500">{detail.label}:</span>
                          <span className="text-gray-300 font-medium">
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 mt-6 border-t border-gray-800">
                  {selectedProject.live && (
                    <a
                      href={selectedProject.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <i className="uil uil-external-link-alt"></i>
                      Live Demo
                    </a>
                  )}

                  {selectedProject.github && (
                    <a
                      href={selectedProject.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <i className="uil uil-github"></i>
                      Source Code
                    </a>
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
