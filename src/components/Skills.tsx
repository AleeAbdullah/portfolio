"use client";
import { Braces, Database, MonitorCog } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

// Skills Component
const Skills = () => {
  const [activeTab, setActiveTab] = useState("frontend");

  const skillsData = {
    frontend: [
      { name: "HTML", percentage: 90 },
      { name: "CSS", percentage: 80 },
      { name: "Javascript", percentage: 90 },
      { name: "React", percentage: 75 },
      { name: "Next.js", percentage: 80 },
      { name: "Tailwind CSS", percentage: 90 },
    ],
    "backend-and-database": [
      { name: "Express.js", percentage: 70 },
      { name: "Python", percentage: 40 },
      { name: "Firebase", percentage: 95 },
      { name: "Supabase", percentage: 80 },
      { name: "MongoDB", percentage: 70 },
      { name: "MySQL", percentage: 60 },
    ],
  };

  const tabData = [
    {
      id: "frontend",
      icon: <Braces />,
      title: "Frontend",
      experience: "More than 2 years",
    },
    {
      id: "backend-and-database",
      icon: <MonitorCog />,
      title: "Backend & Database",
      experience: "More than an year",
    },
  ];

  return (
    <section className={cn("py-16 md:py-20 lg:py-24 transition-colors duration-300", "bg-background")} id="skills">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative mb-12 md:mb-16 text-center"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          viewport={{ once: true }}
        >
          <h2 className={cn("text-2xl sm:text-3xl font-bold border-b-2 pb-2 inline-block transition-colors duration-300", "text-foreground border-border")}>
            My Experience
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 max-w-6xl mx-auto">
          <div className="flex flex-col gap-y-4 sm:gap-y-6">
            {tabData.map((tab) => (
              <motion.div
                key={tab.id}
                className={cn(
                  "group flex items-center p-4 sm:p-6 rounded-lg cursor-pointer transition-all duration-300 border border-transparent",
                  activeTab === tab.id
                    ? "bg-card border-primary/50 shadow-lg"
                    : "hover:bg-card hover:border-border"
                )}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className="text-2xl sm:text-3xl mr-3 sm:mr-4 transition-colors duration-300"
                  animate={{
                    color: activeTab === tab.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {tab.icon}
                </motion.div>
                <div className="flex-1">
                  <h1
                    className={cn(
                      "text-lg sm:text-xl font-medium transition-colors duration-300",
                      activeTab === tab.id ? "text-primary" : "text-foreground"
                    )}
                  >
                    {tab.title}
                  </h1>
                  <span className={cn("text-xs sm:text-sm transition-colors duration-300", "text-muted-foreground")}>
                    {tab.experience}
                  </span>
                </div>
                <motion.i
                  className={cn(
                    "uil uil-angle-down text-2xl sm:text-3xl transition-all duration-300",
                    activeTab === tab.id
                      ? "transform -rotate-180 text-primary"
                      : "text-muted-foreground"
                  )}
                  animate={{ rotate: activeTab === tab.id ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                ></motion.i>
              </motion.div>
            ))}
          </div>

          <div className="skills-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid gap-y-6"
              >
                {skillsData[activeTab as keyof typeof skillsData].map(
                  (skill, index) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                    >
                      <div className="flex justify-between mb-2">
                        <h3 className={cn("text-sm sm:text-base font-medium transition-colors duration-300", "text-foreground")}>
                          {skill.name}
                        </h3>
                        <span className={cn("text-xs sm:text-sm transition-colors duration-300", "text-muted-foreground")}>
                          {skill.percentage}%
                        </span>
                      </div>
                      <div className={cn("h-2 rounded-full overflow-hidden transition-colors duration-300", "bg-muted")}>
                        <motion.div
                          className={cn("h-full rounded-full relative overflow-hidden", "bg-primary")}
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.percentage}%` }}
                          transition={{
                            delay: index * 0.1 + 0.2,
                            duration: 1,
                            ease: "easeOut",
                          }}
                        >
                          <motion.div
                            className="absolute inset-0 bg-white/20"
                            animate={{
                              x: ["-100%", "200%"],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          ></motion.div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Skills;
