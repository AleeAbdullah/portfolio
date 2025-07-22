"use client";
import { useState } from "react";

interface Service {
  title: string;
  icon: string;
  description: string;
  details: string[];
}

const services: Service[] = [
  {
    title: "Web <br /> Development",
    icon: "uil uil-web-grid",
    description:
      "I offer full-stack web development services with modern technologies and best practices for scalable applications.",
    details: [
      "Custom Web Application Development",
      "RESTful API Design & Implementation",
      "Database Design & Optimization",
      "Performance Optimization",
      "Progressive Web Apps (PWA)",
      "E-commerce Solutions",
      "CMS Integration",
    ],
  },
  {
    title: "Mobile <br /> Development",
    icon: "uil uil-mobile-android",
    description:
      "I create cross-platform mobile applications that deliver native performance and exceptional user experience.",
    details: [
      "React Native Development",
      "iOS & Android Apps",
      "App Store Deployment",
      "Push Notifications",
      "Offline Functionality",
      "Real-time Features",
      "App Maintenance & Updates",
    ],
  },
  {
    title: "UI/UX <br /> Design",
    icon: "uil uil-edit",
    description:
      "I design intuitive and visually appealing interfaces that enhance user engagement and satisfaction.",
    details: [
      "User Interface Design",
      "User Experience Research",
      "Wireframing & Prototyping",
      "Design Systems",
      "Responsive Design",
      "Accessibility Standards",
      "Usability Testing",
    ],
  },
];

const Services = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const openModal = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedService(null), 300);
  };

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-gray-950" id="services">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mb-12 md:mb-16 text-center">
          <span className="text-xs sm:text-sm font-medium text-gray-100 absolute -top-3 left-1/2 transform -translate-x-1/2">
            Services
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 border-b-2 border-gray-800 pb-2 inline-block">
            What I Offer
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <div
              className="group relative bg-gray-900 p-8 lg:p-10 rounded-xl transition-all duration-500 hover:bg-gray-800 hover:scale-105 hover:shadow-2xl opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
              style={{ animationDelay: `${index * 0.1}s` }}
              key={index}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-600/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <i
                className={`${service.icon} block text-4xl lg:text-5xl text-rose-600 mb-6 transition-transform duration-500 group-hover:scale-110`}
              ></i>

              <h3
                className="text-xl lg:text-2xl font-semibold mb-4 text-gray-100 leading-tight"
                dangerouslySetInnerHTML={{ __html: service.title }}
              ></h3>

              <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                {service.description}
              </p>

              <button
                onClick={() => openModal(service)}
                className="group/btn inline-flex items-center gap-2 text-rose-600 hover:text-rose-500 transition-colors duration-300"
              >
                <span className="text-sm font-medium">View More</span>
                <i className="uil uil-arrow-right transform transition-transform duration-300 group-hover/btn:translate-x-1"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300 ${
          isModalOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeModal}
      >
        <div
          className={`w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl transform transition-all duration-300 ${
            isModalOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-10"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {selectedService && (
            <>
              <div className="relative p-8 lg:p-10">
                <button
                  onClick={closeModal}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors duration-300 group"
                >
                  <i className="uil uil-times text-xl text-gray-400 group-hover:text-white transition-colors"></i>
                </button>

                <div className="text-center mb-8">
                  <i
                    className={`${selectedService.icon} text-5xl text-rose-600 mb-4`}
                  ></i>
                  <h3
                    className="text-2xl lg:text-3xl font-bold text-gray-100 mb-4"
                    dangerouslySetInnerHTML={{
                      __html: selectedService.title.replace("<br />", " "),
                    }}
                  ></h3>
                  <p className="text-gray-400 max-w-lg mx-auto">
                    {selectedService.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-100 mb-4">
                    Services Include:
                  </h4>
                  <ul className="grid gap-y-3">
                    {selectedService.details.map((detail, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-x-3 opacity-0 animate-[slideInLeft_0.5s_ease-out_forwards]"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <i className="uil uil-check-circle text-rose-600 text-xl mt-0.5 flex-shrink-0"></i>
                        <p className="text-gray-300">{detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={closeModal}
                    className="px-8 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors duration-300 font-medium"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default Services;
