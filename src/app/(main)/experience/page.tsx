import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { Experience } from '@/components/portfolio/experience';
import { EditorialView } from '@/components/looks/editorial-view';
import { EditorialNext } from '@/components/editorial/editorial-next';
import { LookView } from '@/components/looks/look-view';
import { getContent, getThemeSettings } from '@/lib/content';
import { siteUrl } from '@/lib/blog';
import { experienceSince } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Experience — Boda Madhukar Reddy',
  description: 'Senior Software Engineer at Revalsys Technologies: .NET R&D, multi-tenant RAG and MCP platforms, hybrid search, offline-first apps and large e-commerce builds.',
  alternates: { canonical: '/experience' },
};

export default async function ExperiencePage() {
  const [{ experience, clientProjects, keyProjects, rdProjects, story }, themes] = await Promise.all([getContent(), getThemeSettings()]);
  const base = siteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Experience', item: `${base}/experience` },
    ],
  };

  // Whole years since the start month in the experience data.
  const career = experienceSince(experience.duration);
  const stats = [
    { value: career.years, suffix: '+', label: `years building, since ${career.since}` },
    { value: keyProjects.length + clientProjects.length, label: 'projects delivered' },
    { value: clientProjects.length, label: 'e-commerce portals' },
    { value: rdProjects.length, label: 'R&D experiments' },
  ];
  return (
    <PageShell
      eyebrow="Experience"
      title="Where I've built."
      description="Building since December 2021: from R&D prototypes to high-traffic retail platforms."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <EditorialView page="experience" defaultLook={themes.defaultTheme} props={{ experience, stats, journey: story.journey }} />
      <LookView page="experience" defaultLook={themes.defaultTheme} props={{ experience, clientProjects, journey: story.journey }} />
      <div className="classic-only">
        <Experience experience={experience} clientProjects={clientProjects} stats={stats} />
      </div>
      <EditorialNext from="/experience" />
    </PageShell>
  );
}
