import { HomeHero } from '@/components/portfolio/home-hero';
import { RecentBlogs } from '@/components/portfolio/recent-blogs';

export default function Home() {
  return (
    <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-10 lg:pt-36 pb-12 lg:pb-16">
      <HomeHero />
      <div className="mt-14 md:mt-20">
        <RecentBlogs />
      </div>
    </div>
  );
}
