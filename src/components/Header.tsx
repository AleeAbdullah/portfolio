"use client";
import { Share2, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useThemeStore } from "../store/themeStore";
import { cn } from "../lib/utils";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("home");
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");

    const navHighlighter = () => {
      const scrollY = window.pageYOffset;
      sections.forEach((current) => {
        const sectionHeight = (current as HTMLElement).offsetHeight;
        const sectionTop = (current as HTMLElement).offsetTop - 50;
        const sectionId = current.getAttribute("id");

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          setActiveLink(sectionId!);
        }
      });
    };

    window.addEventListener("scroll", navHighlighter);
    navHighlighter(); // Call once on mount
    return () => window.removeEventListener("scroll", navHighlighter);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLinkClick = (link: string) => {
    setActiveLink(link);
    setIsOpen(false);
  };

  const navLinks = ["home", "about", "skills", "work", "services", "contact"];

  return (
    <nav className={cn("fixed top-0 left-0 w-full h-16 z-50 transition-colors duration-300", "bg-card/95 backdrop-blur-sm border-b border-border")}>
      <div className="h-full container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Navigation Links - Left Side */}
        <ul className="hidden md:flex items-center gap-x-6 lg:gap-x-8">
          {navLinks.map((link) => (
            <li key={link}>
              <a
                href={`#${link}`}
                onClick={() => handleLinkClick(link)}
                className={cn(
                  "text-sm font-medium transition-colors duration-300 hover:text-primary",
                  activeLink === link ? "text-primary" : "text-foreground"
                )}
              >
                {link.charAt(0).toUpperCase() + link.slice(1)}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile menu button - Left Side (only on small screens) */}
        <div
          className={cn(
            "h-10 w-10 text-xl rounded-md text-primary-foreground flex justify-center items-center cursor-pointer md:hidden transition-colors duration-300",
            "bg-primary hover:opacity-90"
          )}
          onClick={toggleMenu}
        >
          <i className={`uil ${isOpen ? "uil-times" : "uil-bars"}`}></i>
        </div>

        {/* Logo - Center */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center transition-colors duration-300">
            <a href="#home" className="text-lg text-primary-foreground font-bold">
              A
            </a>
          </div>
        </div>

        {/* Theme Toggle and Share Icon - Right Side */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "w-10 h-10 rounded-md flex justify-center items-center cursor-pointer transition-all duration-300 hover:scale-110",
              "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon size={18} className="text-primary" />
            ) : (
              <Sun size={18} className="text-primary" />
            )}
          </button>

          {/* Share Icon */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="text-foreground hover:text-primary transition-colors duration-300 cursor-pointer hidden sm:block"
            aria-label="Share page"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu (only for small screens) */}
      <div
        className={cn(
          "absolute top-16 left-0 w-full transition-all duration-300 md:hidden border-b border-border",
          "bg-card",
          isOpen ? "opacity-100 visible max-h-96" : "opacity-0 invisible max-h-0 overflow-hidden"
        )}
      >
        <ul className="py-4">
          {navLinks.map((link) => (
            <li key={link}>
              <a
                href={`#${link}`}
                onClick={() => handleLinkClick(link)}
                className={cn(
                  "block px-4 py-2 text-sm font-medium transition-colors duration-300 hover:bg-accent",
                  activeLink === link ? "text-primary" : "text-foreground"
                )}
              >
                {link.charAt(0).toUpperCase() + link.slice(1)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Header;
