"use client";
import { useEffect, useRef } from "react";

const testimonials = [
  {
    quote:
      "Working with Ali was an absolute pleasure from start to finish. He took the time to truly understand our business needs and translated them into a stunning and highly functional application.",
    date: "March 30, 2025",
    name: "Chen Xiuying",
    title: "Marketing Director",
    company: "TechCorp Solutions",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    quote:
      "Ali truly understood our business needs through his modern and sleek design, making our app incredibly user-friendly. With his help, we had a significant increase in engagement and customer retention.",
    date: "January 18, 2025",
    name: "Joshua Middletown",
    title: "Sales Director",
    company: "Growth Dynamics",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    quote:
      "I was blown away by the mobile app Ali created for my business! He crafted an incredibly user-friendly experience that allows our customers to access information seamlessly. Since the launch, I've seen a 200% increase in user engagement.",
    date: "November 29, 2024",
    name: "Melanie Stone",
    title: "Business Owner",
    company: "Stone Enterprises",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
];

const Testimonials = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDown.current = true;
      container.classList.add("cursor-grabbing");
      startX.current = e.pageX - container.offsetLeft;
      scrollLeft.current = container.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown.current = false;
      container.classList.remove("cursor-grabbing");
    };

    const handleMouseUp = () => {
      isDown.current = false;
      container.classList.remove("cursor-grabbing");
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown.current) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX.current) * 2;
      container.scrollLeft = scrollLeft.current - walk;
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-gray-900" id="testimonials">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mb-12 md:mb-16 text-center">
          <span className="text-xs sm:text-sm font-medium text-gray-100 absolute -top-3 left-1/2 transform -translate-x-1/2">
            My clients say
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 border-b-2 border-gray-800 pb-2 inline-block">
            Testimonials
          </h2>
        </div>

        {/* Testimonials Container */}
        <div className="relative max-w-7xl mx-auto">
          <div
            ref={containerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide cursor-grab pb-4"
            style={{ scrollBehavior: "smooth" }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="min-w-[300px] md:min-w-[400px] bg-gray-800 p-8 rounded-2xl relative opacity-0 animate-[fadeIn_0.6s_ease-out_forwards] select-none"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 text-5xl text-rose-600/20">
                  <i className="bx bxs-quote-alt-right"></i>
                </div>

                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="bx bxs-star text-yellow-500"></i>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 mb-6 relative z-10 italic">
                  "{testimonial.quote}"
                </p>

                {/* Date */}
                <p className="text-sm text-gray-500 mb-6">{testimonial.date}</p>

                {/* Profile */}
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-rose-600"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {testimonial.title} at {testimonial.company}
                    </p>
                  </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 to-transparent rounded-b-2xl"></div>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  const container = containerRef.current;
                  if (container) {
                    const cardWidth = container.children[0]?.clientWidth || 0;
                    container.scrollLeft = index * (cardWidth + 24);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === 0
                    ? "w-8 bg-rose-600"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-rose-600 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 border-2 border-rose-600 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-rose-600 rounded-full"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .cursor-grabbing {
          cursor: grabbing !important;
        }
      `}</style>
    </section>
  );
};

export default Testimonials;
