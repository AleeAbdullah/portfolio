//src/app/page.tsx

import About from "../src/components/About";
import Contact from "../src/components/Contact";
import Footer from "../src/components/Footer";
import Header from "../src/components/Header";
import Hero from "../src/components/Hero";
import Projects from "../src/components/Projects";
import Qualification from "../src/components/Qualification";
import Services from "../src/components/Services";
import Skills from "../src/components/Skills";
import Testimonials from "../src/components/Testimonials";

import "./globals.css";

export default function Home() {
  return (
    <main className="bg-background transition-colors duration-300 h-full overflow-auto no-scrollbar rounded-xl">
      <Header />
      <div className="overflow-hidden rounded-xl">
        <Hero />
        <About />
        <Qualification />
        <Skills />
        <Projects />
        <Services />
        {/* <Testimonials /> */}
        <Contact />
        <Footer />
      </div>
    </main>
  );
}
