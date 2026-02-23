"use client";
import { Download, Sun, Moon, List, FileUser } from "lucide-react";
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
    <nav
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 w-full md:w-3xl h-14 z-50 transition-colors duration-300",
        "bg-background-secondary backdrop-blur-sm border border-t-0  border-border rounded-b-xl"
      )}
    >
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
          <List size={20} />
        </div>

        {/* Theme Toggle and Download CV Button - Right Side */}
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

          {/* Download CV Button */}
          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = "/cv.pdf";
              link.download = "Ali_Abdullah_CV.pdf";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm transition-colors duration-300 cursor-pointer "
            aria-label="Download CV"
          >
            <FileUser size={20} />
            Resume
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu (only for small screens) */}
      <div
        className={cn(
          "absolute top-16 left-0 w-full transition-all duration-300 md:hidden border-b border-border",
          "bg-card",
          isOpen
            ? "opacity-100 visible max-h-96"
            : "opacity-0 invisible max-h-0 overflow-hidden"
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
