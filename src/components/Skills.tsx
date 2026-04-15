"use client";
import { Brush, Megaphone } from "lucide-react";
import { useState } from "react";

// Skills Component
const Skills = () => {
  const [activeTab, setActiveTab] = useState("design-tools");

  const skillsData = {
    "design-tools": [
      { name: "Adobe Illustrator", percentage: 95 },
      { name: "Adobe Photoshop", percentage: 90 },
      { name: "Canva", percentage: 92 },
      { name: "Brand Identity Design", percentage: 88 },
      { name: "Stream Overlay Design", percentage: 94 },
      { name: "Etsy Product Listing Design", percentage: 86 },
    ],
    "creative-strategy": [
      { name: "Pitch Deck Design", percentage: 87 },
      { name: "Social Media Graphics", percentage: 93 },
      { name: "Merchandise Design", percentage: 82 },
      { name: "Content Strategy & Planning", percentage: 85 },
      { name: "Creativity & Storytelling", percentage: 90 },
      { name: "Communication & Collaboration", percentage: 88 },
    ],
  };

  const tabData = [
    {
      id: "design-tools",
      icon: <Brush />,
      title: "Design Tools",
      experience: "3+ years",
    },
    {
      id: "creative-strategy",
      icon: <Megaphone />,
      title: "Creative Strategy",
      experience: "Campaigns, branding, and content planning",
    },
  ];

  return (
    <section className="py-16 md:py-20 lg:py-24 " id="skills">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mb-12 md:mb-16 text-center">
          <h2 className="mt-3 text-4xl font-bold text-gray-100">My Experience</h2>
          <p className="mt-2 text-center text-rose-500">
            Design Skills & Creative Focus
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 max-w-6xl mx-auto">
          <div className="flex flex-col gap-y-4 sm:gap-y-6">
            {tabData.map((tab) => (
              <div
                key={tab.id}
                className={`group flex items-center p-4 sm:p-6 rounded-lg cursor-pointer transition-all duration-300 hover:bg-gray-900 ${activeTab === tab.id ? "bg-gray-900 shadow-lg" : ""
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div
                  className={` text-2xl sm:text-3xl mr-3 sm:mr-4 transition-colors duration-300 ${activeTab === tab.id
                      ? "text-rose-600"
                      : "text-gray-400 group-hover:text-rose-600"
                    }`}
                >
                  {tab.icon}
                </div>
                <div className="flex-1">
                  <h1
                    className={`text-lg sm:text-xl font-medium transition-colors duration-300 ${activeTab === tab.id ? "text-rose-600" : "text-gray-100"
                      }`}
                  >
                    {tab.title}
                  </h1>
                  <span className="text-xs sm:text-sm text-gray-400">
                    {tab.experience}
                  </span>
                </div>
                <i
                  className={`uil uil-angle-down text-2xl sm:text-3xl transition-all duration-300 ${activeTab === tab.id
                      ? "transform -rotate-180 text-rose-600"
                      : "text-gray-400"
                    }`}
                ></i>
              </div>
            ))}
          </div>

          <div className="skills-content">
            <div className="grid gap-y-6">
              {skillsData[activeTab as keyof typeof skillsData].map(
                (skill, index) => (
                  <div
                    key={skill.name}
                    className="opacity-0 animate-[slideInRight_0.6s_ease-out_forwards]"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between mb-2">
                      <h3 className="text-sm sm:text-base font-medium text-gray-100">
                        {skill.name}
                      </h3>
                      <span className="text-xs sm:text-sm text-gray-400">
                        {skill.percentage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-500 relative overflow-hidden animate-[progressBar_1.5s_ease-out_forwards]"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          width: `${skill.percentage}%`,
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progressBar {
          from {
            width: 0;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
};

export default Skills;
