import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { KnowledgeGraphView } from '@/components/portfolio/knowledge-graph';
import { buildKnowledgeGraph } from '@/lib/knowledge-graph';
import { getContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Knowledge graph — Boda Madhukar Reddy',
  description:
    'An interactive map of my projects, R&D experiments, blog posts and the technologies that connect them.',
};

export default async function GraphPage() {
  // Built on the server; only labels and links reach the browser.
  const graph = buildKnowledgeGraph(await getContent());
  return (
    <PageShell
      eyebrow="Knowledge graph"
      title="How it all connects."
      description="Projects, experiments and writing, linked through the technologies they share. It's modelled on the graph view of the Obsidian vault where this work is documented."
      className="max-w-6xl"
    >
      <KnowledgeGraphView graph={graph} />
    </PageShell>
  );
}
