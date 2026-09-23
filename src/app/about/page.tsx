import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { Summary } from '@/components/portfolio/summary';
import { Skills } from '@/components/portfolio/skills';
import { Education } from '@/components/portfolio/education';

export const metadata: Metadata = {
  title: 'About — Boda Madhukar Reddy',
  description: 'Backend-focused Software Architect: .NET Core, Redis, Solr, SQL Server, k6 performance engineering and AI integrations.',
};

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="Production-first engineering."
      description="Diagnose fast, fix right, prevent recurrence — the approach behind every system I build."
    >
      <Summary />
      <Skills />
      <Education />
    </PageShell>
  );
}
