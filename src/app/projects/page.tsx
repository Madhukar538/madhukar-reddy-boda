import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { PageShell } from '@/components/portfolio/page-shell';
import { Projects } from '@/components/portfolio/projects';
import { BlogStrip } from '@/components/blog/blog-strip';
import { getContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Projects — Boda Madhukar Reddy',
  description: 'IoT data platforms, developer tooling, video conferencing, RAG systems and e-commerce builds for Jockey, Speedo, Manyavar and more.',
};

export default async function ProjectsPage() {
  const { posts, keyProjects, clientProjects } = await getContent();
  return (
    <PageShell
      eyebrow="Projects"
      title="Selected work."
      description="Systems built from scratch, plus the e-commerce portals and integrations I've led."
    >
      <Projects keyProjects={keyProjects} clientProjects={clientProjects} />

      <BlogStrip posts={posts} className="mt-14" />

      <Link href="/lab" className="group glass glass-interactive mt-8 flex items-center gap-4 p-5 md:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--sys-purple)/0.15)] text-[hsl(var(--sys-purple))]">
          <FlaskConical className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-[17px] font-semibold text-foreground">Visit the R&amp;D Lab</span>
          <span className="block text-sm text-muted-foreground">Experiments, proofs of concept and internal tools.</span>
        </span>
        <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
      </Link>
    </PageShell>
  );
}
