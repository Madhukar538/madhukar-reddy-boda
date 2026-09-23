import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { Research } from '@/components/portfolio/research';

export const metadata: Metadata = {
  title: 'R&D Lab — Boda Madhukar Reddy',
  description: 'Experiments in load testing, AI code review, RAG, IoT predictive maintenance, encryption, messaging and gRPC.',
};

export default function LabPage() {
  return (
    <PageShell
      eyebrow="R&D Lab"
      title="Experiments & explorations."
      description="Where ideas get pressure-tested before they reach production."
    >
      <Research />
    </PageShell>
  );
}
