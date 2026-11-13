import About from "./About";
import Contact from "./Contact";
import Footer from "./Footer";
import Header from "./Header";
import Hero from "./Hero";
import Projects from "./Projects";
import Qualification from "./Qualification";
import Services from "./Services";
import Skills from "./Skills";


export default function ClassicPortfolio() {
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
