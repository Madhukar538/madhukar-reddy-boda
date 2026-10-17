import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { Experience } from '@/components/portfolio/experience';
import { getContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Experience — Boda Madhukar Reddy',
  description: 'Software Architect at Revalsys Technologies: .NET R&D, multi-tenant RAG and MCP platforms, hybrid search, offline-first apps and large e-commerce builds.',
};

export default async function ExperiencePage() {
  const { experience, clientProjects, keyProjects, rdProjects } = await getContent();
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
      <Experience experience={experience} clientProjects={clientProjects} stats={stats} />
    </PageShell>
  );
}
