import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, FlaskConical, PenLine } from 'lucide-react';
import { PageShell } from '@/components/portfolio/page-shell';
import { HybridSearchVisualizer } from '@/components/portfolio/hybrid-search-visualizer';

export const metadata: Metadata = {
  title: 'Hybrid Search Visualizer (BM25 vs Vector vs RRF) — Boda Madhukar Reddy',
  description:
    'Interactive visualization comparing Okapi BM25 keyword search, dense vector kNN semantic search, and Reciprocal Rank Fusion (RRF) on Solr 9 and .NET.',
};

export default function HybridSearchPage() {
  return (
    <PageShell
      eyebrow="Interactive R&D Experiment"
      title="Hybrid Search Visualizer."
      description={
        <span>
          A live laboratory comparing <strong>Okapi BM25</strong> lexical matching against{' '}
          <strong>Dense Vector kNN</strong> semantic search, and fusing both with{' '}
          <strong>Reciprocal Rank Fusion (RRF)</strong> as built for e-commerce catalog search on Solr 9.
        </span>
      }
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/lab"
            className="chip tap inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to R&amp;D Lab
          </Link>
          <Link
            href="/blog/hybrid-search-solr-bm25-vector-rrf"
            className="chip chip-accent tap inline-flex items-center gap-1 text-xs font-medium"
          >
            <PenLine className="h-3.5 w-3.5" />
            Read Solr 9 Architecture Post
          </Link>
        </div>
      }
    >
      <HybridSearchVisualizer />
    </PageShell>
  );
}

