import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { Experience } from '@/components/portfolio/experience';

export const metadata: Metadata = {
  title: 'Experience — Boda Madhukar Reddy',
  description: 'Software Architect at Revalsys Technologies: .NET R&D, multi-tenant RAG and MCP platforms, hybrid search, offline-first apps and large e-commerce builds.',
};

export default function ExperiencePage() {
  return (
    <PageShell
      eyebrow="Experience"
      title="Where I've built."
      description="Five years of shipping backend systems — from R&D prototypes to high-traffic retail platforms."
    >
      <Experience />
    </PageShell>
  );
}
