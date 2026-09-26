import type { Metadata } from 'next';
import { HomeHero } from '@/components/portfolio/home-hero';
import { Summary } from '@/components/portfolio/summary';
import { Skills } from '@/components/portfolio/skills';
import { Education } from '@/components/portfolio/education';
import { BlogStrip } from '@/components/blog/blog-strip';
import { allTopics, posts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'About — Boda Madhukar Reddy',
  description: 'Backend-focused Software Architect: .NET 10, Next.js, Solr, SQL Server, Redis, k6 performance engineering, RAG, MCP and self-hosted LLMs.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-10 lg:pt-36 pb-12 lg:pb-16">
      <HomeHero
        stats={{
          posts: posts.length,
          topics: allTopics().length,
          latest: { slug: posts[0].slug, title: posts[0].title, date: posts[0].date },
          // The page is static, so this is the deploy date.
          updated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }}
      />
      <BlogStrip className="mt-14 md:mt-20" />
      <div className="mt-14 md:mt-20">
        <Summary />
        <Skills />
        <Education />
      </div>
    </div>
  );
}
