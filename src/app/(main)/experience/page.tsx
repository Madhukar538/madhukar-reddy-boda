import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { Experience } from '@/components/portfolio/experience';
import { EditorialJourney } from '@/components/editorial/editorial-journey';
import { EditorialNext } from '@/components/editorial/editorial-next';
import { ArcticExperience } from '@/components/looks/arctic-pages';
import { SynthwaveExperience } from '@/components/looks/synthwave-pages';
import { DuneExperience } from '@/components/looks/dune-pages';
import { GazetteExperience } from '@/components/looks/gazette';
import { ReceiptExperience } from '@/components/looks/receipt';
import { ObservatoryExperience } from '@/components/looks/observatory';
import { getContent } from '@/lib/content';
import { siteUrl } from '@/lib/blog';
import { experienceSince } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Experience — Boda Madhukar Reddy',
  description: 'Senior Software Engineer at Revalsys Technologies: .NET R&D, multi-tenant RAG and MCP platforms, hybrid search, offline-first apps and large e-commerce builds.',
  alternates: { canonical: '/experience' },
};

export default async function ExperiencePage() {
  const { experience, clientProjects, keyProjects, rdProjects, story } = await getContent();
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
      <EditorialJourney experience={experience} stats={stats} journey={story.journey} />
      <ArcticExperience experience={experience} clientProjects={clientProjects} journey={story.journey} />
      <SynthwaveExperience experience={experience} clientProjects={clientProjects} journey={story.journey} />
      <DuneExperience experience={experience} clientProjects={clientProjects} journey={story.journey} />
      <GazetteExperience experience={experience} clientProjects={clientProjects} journey={story.journey} />
      <ReceiptExperience experience={experience} clientProjects={clientProjects} journey={story.journey} />
      <ObservatoryExperience experience={experience} clientProjects={clientProjects} journey={story.journey} />
      <div className="classic-only">
        <Experience experience={experience} clientProjects={clientProjects} stats={stats} />
      </div>
      <EditorialNext from="/experience" />
    </PageShell>
  );
}
