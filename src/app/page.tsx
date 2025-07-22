//src/app/page.tsx

import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Qualification from "@/components/Qualification";
import Services from "@/components/Services";
import Skills from "@/components/Skills";
import Testimonials from "@/components/Testimonials";

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
