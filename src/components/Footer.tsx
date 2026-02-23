"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Github, Linkedin, Phone, Mail } from "lucide-react";
import { cn } from "../lib/utils";

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const currentYear = new Date().getFullYear();

  // Show button when page is scrolled up to a certain amount
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set up event listener for scroll
  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const footerLinks = [
    { href: "#about", label: "About" },
    { href: "#skills", label: "Skills" },
    { href: "#work", label: "Projects" },
    { href: "#contact", label: "Contact" },
  ];

  const socialLinks = [
    {
      href: "https://github.com/ali-abdullah1",
      icon: <Github size={20} />,
      label: "GitHub",
    },
    {
      href: "https://www.linkedin.com/in/ali-abdullah-854716224/",
      icon: <Linkedin size={20} />,
      label: "LinkedIn",
    },
    {
      href: "https://wa.me/923214614610",
      icon: <Phone size={20} />,
      label: "WhatsApp",
    },
    {
      href: "mailto:ali.37803990@gmail.com",
      icon: <Mail size={20} />,
      label: "Email",
    },
  ];

  return (
    <footer className={cn("relative pt-20 transition-colors duration-300", "bg-background")}>
      {/* Wave SVG */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none">
        <svg
          className="relative block w-full h-[60px] sm:h-[90px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className={cn("fill-current transition-colors duration-300", "text-background")}
          ></path>
        </svg>
      </div>

      <div className="container mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-12">
          {/* Brand Section */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h1 className={cn("text-3xl font-bold mb-2 transition-colors duration-300", "text-foreground")}>
              Ali Abdullah
            </h1>
            <span className={cn("text-sm block mb-4 transition-colors duration-300", "text-muted-foreground")}>
              Full Stack Developer
            </span>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className={cn("text-lg font-semibold mb-4 transition-colors duration-300", "text-foreground")}>
              Quick Links
            </h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={cn("text-sm transition-colors duration-300", "text-muted-foreground hover:text-primary")}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social Links */}
          <motion.div
            className="text-center md:text-right"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className={cn("text-lg font-semibold mb-4 transition-colors duration-300", "text-foreground")}>
              Connect
            </h3>
            <div className="flex justify-center md:justify-end gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("group w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300", "bg-secondary hover:bg-primary")}
                  aria-label={social.label}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={cn("transition-colors duration-300", "text-muted-foreground group-hover:text-primary-foreground")}>
                    {social.icon}
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Divider & Copyright */}
        <motion.div
          className={cn("border-t pt-8 text-center text-xs transition-colors duration-300", "border-border text-muted-foreground")}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p>© {currentYear} Ali Abdullah. All rights reserved.</p>
        </motion.div>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className={cn("fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-50", "bg-primary text-primary-foreground hover:opacity-90")}
            aria-label="Back to top"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
};

export default Footer;
