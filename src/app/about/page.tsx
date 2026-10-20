import type { Metadata } from 'next';
import { HomeHero } from '@/components/portfolio/home-hero';
import { PortraitBackdrop } from '@/components/portfolio/portrait-backdrop';
import { Summary } from '@/components/portfolio/summary';
import { Skills } from '@/components/portfolio/skills';
import { Education } from '@/components/portfolio/education';
import { allTopics, siteUrl } from '@/lib/blog';
import { getContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'About — Boda Madhukar Reddy',
  description: 'Backend-focused Software Engineer: .NET 10, Next.js, Solr, SQL Server, Redis, k6 performance engineering, RAG, MCP and self-hosted LLMs.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const content = await getContent();
  const { posts } = content;
  const base = siteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${base}/about#webpage`,
        url: `${base}/about`,
        name: 'About Boda Madhukar Reddy',
        mainEntity: { '@id': `${base}/#person` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: base },
          { '@type': 'ListItem', position: 2, name: 'About', item: `${base}/about` },
        ],
      },
    ],
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
    />
    <PortraitBackdrop />
    <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-10 lg:pt-36 pb-12 lg:pb-16">
      <HomeHero
        content={{
          profile: content.profile,
          socialLinks: content.socialLinks,
          keyProjects: content.keyProjects,
          clientProjects: content.clientProjects,
          rdProjects: content.rdProjects,
        }}
        stats={{
          posts: posts.length,
          topics: allTopics(posts).length,
          latest: { slug: posts[0].slug, title: posts[0].title, date: posts[0].date },
          // The page is static, so this is when it was last built or refreshed.
          updated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }}
      />
      <div className="mt-14 md:mt-20">
        <Summary />
        <Skills skillCategories={content.skillCategories} />
        <Education education={content.education} />
      </div>
    </div>
    </>
  );
}
