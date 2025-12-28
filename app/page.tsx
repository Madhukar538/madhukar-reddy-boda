import { Header } from '@/components/portfolio/header';
import { Hero } from '@/components/portfolio/hero';
import { Summary } from '@/components/portfolio/summary';
import { Skills } from '@/components/portfolio/skills';
import { Experience } from '@/components/portfolio/experience';
import { Projects } from '@/components/portfolio/projects';
import { Education } from '@/components/portfolio/education';
import { Footer } from '@/components/portfolio/footer';
import { Research } from '@/components/portfolio/research';

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6">
        <Hero />
        <Summary />
        <Skills />
        <Experience />
        <Projects />
        <Research />
        <Education />
      </main>
      <Footer />
    </div>
  );
}
