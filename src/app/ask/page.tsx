import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { MadhuBot } from '@/components/portfolio/madhu-bot';

export const metadata: Metadata = {
  title: 'Ask Madhu-bot — Boda Madhukar Reddy',
  description:
    'Ask questions about my work. Answers come only from my blog, projects and experience, with every retrieved passage and score shown.',
};

export default function AskPage() {
  return (
    <PageShell
      eyebrow="Madhu-bot"
      title="Ask me, and see how I answer."
      description="A small retrieval system over everything on this site. Every answer cites its sources, and one click shows the full trace: query terms, BM25 scores, matched words and timings."
    >
      <MadhuBot />
    </PageShell>
  );
}
