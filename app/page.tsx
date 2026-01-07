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
    <main className="">
      <Header />
      <div className="lg:ml-[100px]">
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
