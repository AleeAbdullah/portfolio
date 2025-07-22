"use client";
import { Share2 } from "lucide-react";
import { useState, useEffect } from "react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("home");

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
    <>
      {/* Top Navigation Bar for screens smaller than lg */}
      <nav className="fixed top-0 left-0 w-full h-16 bg-gray-950 border-b border-gray-900 z-50 lg:hidden">
        <div className="h-full flex items-center justify-between px-4">
          {/* Logo */}
          <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center">
            <a href="#" className="text-lg text-gray-100 font-bold">
              A
            </a>
          </div>

          {/* Desktop view (sm to lg) - Show all links */}
          <ul className="hidden sm:flex items-center gap-x-12">
            {navLinks.map((link) => (
              <li key={link}>
                <a
                  href={`#${link}`}
                  onClick={() => handleLinkClick(link)}
                  className={`text-sm font-medium transition-colors duration-300 hover:text-rose-600 ${
                    activeLink === link ? "text-rose-600" : "text-gray-100"
                  }`}
                >
                  {link.charAt(0).toUpperCase() + link.slice(1)}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile menu button (only on very small screens) */}
          <div
            className="h-10 w-10 text-xl rounded-md bg-rose-600 text-gray-100 flex justify-center items-center cursor-pointer sm:hidden"
            onClick={toggleMenu}
          >
            <i className={`uil ${isOpen ? "uil-times" : "uil-bars"}`}></i>
          </div>
        </div>

        {/* Mobile dropdown menu (only for very small screens) */}
        <div
          className={`absolute top-16 left-0 w-full bg-gray-950 border-b border-gray-900 transition-all duration-300 sm:hidden ${
            isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          <ul className="py-4">
            {navLinks.map((link) => (
              <li key={link}>
                <a
                  href={`#${link}`}
                  onClick={() => handleLinkClick(link)}
                  className={`block px-4 py-2 text-sm font-medium transition-colors duration-300 hover:bg-gray-900 ${
                    activeLink === link ? "text-rose-600" : "text-gray-100"
                  }`}
                >
                  {link.charAt(0).toUpperCase() + link.slice(1)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="fixed w-24 h-screen bg-gray-950 border-r border-gray-900 z-50 hidden lg:block">
        <nav className="h-full flex flex-col">
          {/* Logo */}
          <div className="pt-7 pb-12">
            <div className="w-10 h-10 rounded-full bg-rose-600 mx-auto flex items-center justify-center">
              <a href="#" className="text-lg text-gray-100 font-bold">
                A
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex items-center">
            <ul className="w-full space-y-12">
              {navLinks.map((link) => (
                <li key={link} className="relative flex justify-center">
                  <a
                    href={`#${link}`}
                    onClick={() => handleLinkClick(link)}
                    className={`block text-sm font-medium transition-colors duration-300 hover:text-rose-600 transform -rotate-90 whitespace-nowrap ${
                      activeLink === link ? "text-rose-600" : "text-gray-100"
                    }`}
                  >
                    {link.charAt(0).toUpperCase() + link.slice(1)}
                  </a>
                  {activeLink === link && (
                    <span className="absolute w-1.5 h-1.5 bg-rose-600 rounded-full right-1/6 top-1/2 -translate-y-1/2"></span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Share Icon */}
          <div className="pb-7 w-full flex justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
            >
              <div className="text-center cursor-pointer ">
                <Share2 />
              </div>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Header;
