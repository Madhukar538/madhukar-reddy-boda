import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Scale } from 'lucide-react';
import { PageShell } from '@/components/portfolio/page-shell';
import { Research } from '@/components/portfolio/research';
import { getContent } from '@/lib/content';
import { siteUrl } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'R&D Lab — Boda Madhukar Reddy',
  description: 'Experiments in load testing, AI code review, RAG, IoT predictive maintenance, encryption, messaging and gRPC.',
  alternates: { canonical: '/lab' },
};

export default async function LabPage() {
  const { rdProjects } = await getContent();
  const base = siteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'R&D Lab', item: `${base}/lab` },
    ],
  };

  return (
    <PageShell
      eyebrow="R&D Lab"
      title="Experiments & explorations."
      description="Where ideas get pressure-tested before they reach production."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {/* Featured Interactive Tool */}
      <div className="mb-10">
        <Link
          href="/lab/hybrid-search"
          className="glass glass-interactive group flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-5 md:p-6 rounded-2xl border-l-4 border-l-[hsl(var(--sys-purple))]"
        >
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="chip chip-purple text-xs font-semibold">Interactive Simulator</span>
              <span className="text-xs text-muted-foreground">Solr 9 + .NET</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              <Scale className="h-5 w-5 text-[hsl(var(--sys-purple))]" />
              Hybrid Search Visualizer: BM25 vs. Vector vs. RRF
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Test why pure BM25 or pure Vector search fails on catalog queries, and watch Reciprocal Rank Fusion synthesize keyword and dense vector candidate lists in real time with interactive K and weight tuning.
            </p>
          </div>
          <span className="tap inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            Launch Sandbox
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <Research rdProjects={rdProjects} />
    </PageShell>
  );
}
