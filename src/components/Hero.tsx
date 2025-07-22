//src/Components/Hero.ts

import { Building2, Facebook, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";

const Hero = () => {
  return (
    <section
      className="bg-gray-950 h-screen relative overflow-hidden pt-[100px] lg:pt-0"
      id="home"
    >
      <div className="container mx-auto px-6 relative h-full flex items-center">
        <div className="absolute top-12 left-6 flex items-center gap-x-18">
          <span className="font-medium text-gray-400 relative after:content-[''] after:absolute after:w-12 after:h-0.5 after:bg-gray-600 after:right-[-4rem] after:top-1/2">
            Follow Me
          </span>
          <div className="inline-flex gap-x-4">
            <a
              href="https://www.instagram.com/aliabdullah82"
              target="_blank"
              className="text-lg text-gray-400 transition-all duration-300 hover:text-rose-600 hover:-translate-y-1"
            >
              <Instagram />
            </a>
            <a
              href="https://www.linkedin.com/in/ali-abdullah-854716224"
              target="_blank"
              className="text-lg text-gray-400 transition-all duration-300 hover:text-rose-600 hover:-translate-y-1"
            >
              <Linkedin />
            </a>
            <a
              href="https://scoopcodes.com/"
              target="_blank"
              className="text-lg text-gray-400 transition-all duration-300 hover:text-rose-600 hover:-translate-y-1"
            >
              <Building2 />
            </a>
            <a
              href="https://www.facebook.com/share/19c1qtHp9v/"
              target="_blank"
              className="text-lg text-gray-400 transition-all duration-300 hover:text-rose-600 hover:-translate-y-1"
            >
              <Facebook />
            </a>
          </div>
        </div>

        <Image
          src="/22.jpg"
          width={500}
          height={800}
          alt="Ali"
          className="hidden lg:block absolute right-20 bottom-0 object-cover rounded-t-full"
        />

        <div className="z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-100 mb-4">
            Hi, I'm Ali Abdullah
          </h1>
          <h3 className="text-xl md:text-2xl font-medium mb-4 text-rose-600">
            Full Stack Developer
          </h3>
          <p className="max-w-md text-gray-300 mb-8">
            I'm a full stack software developer, with extensive knowledge and
            years of experience, working with quality work in web and app
            technologies.
          </p>
          <a
            href="#about"
            className="inline-flex items-center gap-2 bg-rose-600 text-gray-100 px-6 py-3 rounded-md font-medium relative z-10 transition-all duration-300 hover:bg-rose-700"
          >
            <i className="uil uil-user"></i>
            More About me!
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
