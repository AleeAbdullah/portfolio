"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

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
    <section className={cn("py-16 md:py-20 lg:py-24 transition-colors duration-300", "bg-background")} id="services">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative mb-12 md:mb-16 text-center"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          viewport={{ once: true }}
        >
          <span className={cn("text-xs sm:text-sm font-medium absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 transition-colors duration-300", "text-muted-foreground bg-background")}>
            Services
          </span>
          <h2 className={cn("text-2xl sm:text-3xl font-bold border-b-2 pb-2 inline-block transition-colors duration-300", "text-foreground border-border")}>
            What I Offer
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              className={cn("group relative p-8 lg:p-10 rounded-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl", "bg-card border border-border")}
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500", "from-primary/10")}></div>

              <i
                className={cn(`${service.icon} block text-4xl lg:text-5xl mb-6 transition-transform duration-500 group-hover:scale-110`, "text-primary")}
              ></i>

              <h3
                className={cn("text-xl lg:text-2xl font-semibold mb-4 leading-tight transition-colors duration-300", "text-card-foreground")}
                dangerouslySetInnerHTML={{ __html: service.title }}
              ></h3>

              <p className={cn("text-sm mb-6 line-clamp-3 transition-colors duration-300", "text-muted-foreground")}>
                {service.description}
              </p>

              <button
                onClick={() => openModal(service)}
                className={cn("group/btn inline-flex items-center gap-2 transition-colors duration-300", "text-primary hover:opacity-80")}
              >
                <span className="text-sm font-medium">View More</span>
                <i className="uil uil-arrow-right transform transition-transform duration-300 group-hover/btn:translate-x-1"></i>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn("w-full max-w-2xl rounded-2xl shadow-2xl transition-colors duration-300", "bg-card border border-border")}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative p-8 lg:p-10">
                <button
                  onClick={closeModal}
                  className={cn("absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 group", "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground")}
                >
                  <i className="uil uil-times text-xl transition-colors"></i>
                </button>

                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <i
                    className={cn(`${selectedService.icon} text-5xl mb-4`, "text-primary")}
                  ></i>
                  <h3
                    className={cn("text-2xl lg:text-3xl font-bold mb-4 transition-colors duration-300", "text-card-foreground")}
                    dangerouslySetInnerHTML={{
                      __html: selectedService.title.replace("<br />", " "),
                    }}
                  ></h3>
                  <p className={cn("max-w-lg mx-auto transition-colors duration-300", "text-muted-foreground")}>
                    {selectedService.description}
                  </p>
                </motion.div>

                <div className="space-y-4">
                  <h4 className={cn("text-lg font-semibold mb-4 transition-colors duration-300", "text-card-foreground")}>
                    Services Include:
                  </h4>
                  <ul className="grid gap-y-3">
                    {selectedService.details.map((detail, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-x-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                      >
                        <i className={cn("uil uil-check-circle text-xl mt-0.5 flex-shrink-0", "text-primary")}></i>
                        <p className={cn("transition-colors duration-300", "text-muted-foreground")}>{detail}</p>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 flex justify-center">
                  <motion.button
                    onClick={closeModal}
                    className={cn("px-8 py-3 rounded-lg transition-colors duration-300 font-medium", "bg-primary text-primary-foreground hover:opacity-90")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Got it, thanks!
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default Services;
