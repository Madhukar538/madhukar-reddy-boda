import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { Experience } from '@/components/portfolio/experience';
import { getContent } from '@/lib/content';
import { siteUrl } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Experience — Boda Madhukar Reddy',
  description: 'Software Engineer at Revalsys Technologies: .NET R&D, multi-tenant RAG and MCP platforms, hybrid search, offline-first apps and large e-commerce builds.',
  alternates: { canonical: '/experience' },
};

export default async function ExperiencePage() {
  const { experience, clientProjects, keyProjects, rdProjects } = await getContent();
  const base = siteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Experience', item: `${base}/experience` },
    ],
  };

  // Counted from the career start year in the experience data.
  const startYear = Number(experience.duration.match(/\d{4}/)?.[0] ?? 2021);
  const stats = [
    { value: new Date().getFullYear() - startYear, suffix: '+', label: `years building, since ${startYear}` },
    { value: keyProjects.length + clientProjects.length, label: 'projects delivered' },
    { value: clientProjects.length, label: 'e-commerce portals' },
    { value: rdProjects.length, label: 'R&D experiments' },
  ];
  return (
    <PageShell
      eyebrow="Experience"
      title="Where I've built."
      description="Five years of shipping backend systems — from R&D prototypes to high-traffic retail platforms."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Experience experience={experience} clientProjects={clientProjects} stats={stats} />
    </PageShell>
  );
}
