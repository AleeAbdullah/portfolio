//src/app/page.tsx

import About from "../src/components/About";
import Contact from "../src/components/Contact";
import Hero from "../src/components/Hero";
import Projects from "../src/components/Projects";
import Qualification from "../src/components/Qualification";
import Skills from "../src/components/Skills";
import Testimonials from "../src/components/Testimonials";

import "./globals.css";

export default function Home() {
  return (
    <main className="">
      <Hero />
      {/* <About /> */}
      <Qualification />
      <Projects />
      <Skills />
      {/* <Testimonials /> */}
      <Contact />
    </main>
  );
}
