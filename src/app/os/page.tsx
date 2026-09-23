import type { Metadata } from 'next';
import { blogs } from '@/data/blogs';
import { buildKnowledgeGraph } from '@/lib/knowledge-graph';
import { PortfolioOS } from '@/components/os/desktop';

export const metadata: Metadata = {
  title: 'Desktop mode — Boda Madhukar Reddy',
  description: 'The portfolio as a Liquid Glass desktop: windows, dock, Spotlight, a terminal and apps for every section.',
};

export default function OsPage() {
  const data = {
    posts: blogs.map(({ slug, title, date, readTime, category, excerpt, content }) => ({
      slug, title, date, readTime, category, excerpt, content,
    })),
    graph: buildKnowledgeGraph(),
  };
  return <PortfolioOS data={data} />;
}
