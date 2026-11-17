import type { Metadata } from 'next';
import { HomeHero } from '@/components/portfolio/home-hero';
import { PortraitBackdrop } from '@/components/portfolio/portrait-backdrop';
import { Summary } from '@/components/portfolio/summary';
import { Skills } from '@/components/portfolio/skills';
import { Education } from '@/components/portfolio/education';
import { Recognition } from '@/components/portfolio/recognition';
import { EditorialView } from '@/components/looks/editorial-view';
import { EditorialNext } from '@/components/editorial/editorial-next';
import { LookView } from '@/components/looks/look-view';
import { experienceSince } from '@/lib/utils';
import { allTopics, siteUrl } from '@/lib/blog';
import { getContent, getThemeSettings } from '@/lib/content';

export const metadata: Metadata = {
  title: 'About — Boda Madhukar Reddy',
  description: 'Senior Software Engineer and AI architect leading teams of AI coding agents: .NET 10, Next.js, Solr, SQL Server, Redis, k6, RAG, MCP and self-hosted LLMs.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const [content, themes] = await Promise.all([getContent(), getThemeSettings()]);
  const { posts } = content;
  const aboutValues = { name: content.profile.name, degree: content.education.degree, institution: content.education.institution, location: content.education.location, since: experienceSince().since };
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
      <EditorialView page="about" defaultLook={themes.defaultTheme} props={{ name: content.profile.name, education: content.education, about: content.story.about }} />
      <LookView page="about" defaultLook={themes.defaultTheme} props={{ name: content.profile.name, values: aboutValues, about: content.story.about }} />
      <div className="classic-only">
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
      </div>
      <div className="mt-14 md:mt-20">
        <div className="classic-only">
          <Summary />
        </div>
        <Skills skillCategories={content.skillCategories} />
        <Education education={content.education} />
        <Recognition />
      </div>
      <EditorialNext from="/about" />
    </div>
    </>
  );
}
