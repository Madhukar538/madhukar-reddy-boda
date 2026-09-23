import type { Metadata } from 'next';
import { HomeHero } from '@/components/portfolio/home-hero';
import { Summary } from '@/components/portfolio/summary';
import { Skills } from '@/components/portfolio/skills';
import { Education } from '@/components/portfolio/education';

export const metadata: Metadata = {
  title: 'About — Boda Madhukar Reddy',
  description: 'Backend-focused Software Architect: .NET 10, Next.js, Solr, SQL Server, Redis, k6 performance engineering, RAG, MCP and self-hosted LLMs.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-10 lg:pt-36 pb-12 lg:pb-16">
      <HomeHero />
      <div className="mt-14 md:mt-20">
        <Summary />
        <Skills />
        <Education />
      </div>
    </div>
  );
}
