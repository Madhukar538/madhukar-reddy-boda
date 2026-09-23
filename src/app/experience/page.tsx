import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { Experience } from '@/components/portfolio/experience';

export const metadata: Metadata = {
  title: 'Experience — Boda Madhukar Reddy',
  description: 'Software Architect at Revalsys Technologies: .NET R&D, legacy modernization, AI/ML integrations and large e-commerce platforms.',
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
