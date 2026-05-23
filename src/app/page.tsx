import { Hero } from '@/components/portfolio/hero';
import { Summary } from '@/components/portfolio/summary';
import { RecentBlogs } from '@/components/portfolio/recent-blogs';
import { Skills } from '@/components/portfolio/skills';
import { Experience } from '@/components/portfolio/experience';
import { Projects } from '@/components/portfolio/projects';
import { Education } from '@/components/portfolio/education';
import { Footer } from '@/components/portfolio/footer';
import { Research } from '@/components/portfolio/research';

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col pb-20">
      <main className="flex-1 container mx-auto px-4 md:px-6 pt-16 lg:pt-28 lg:grid lg:grid-cols-12 lg:gap-12">
        <Hero />
        <div className="lg:col-span-8 flex flex-col gap-4 md:gap-8 lg:gap-10">
          <Summary />
          <RecentBlogs />
          <Skills />
          <Experience />
          <Projects />
          <Research />
          <Education />
        </div>
      </main>
      <Footer />
    </div>
  );
}
