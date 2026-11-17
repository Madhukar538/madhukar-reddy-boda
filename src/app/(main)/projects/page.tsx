import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { PageShell } from '@/components/portfolio/page-shell';
import { Projects } from '@/components/portfolio/projects';
import { BlogStrip } from '@/components/blog/blog-strip';
import { EditorialCaseFiles } from '@/components/editorial/editorial-case-files';
import { EditorialNext } from '@/components/editorial/editorial-next';
import { ArcticProjects } from '@/components/looks/arctic-pages';
import { SynthwaveProjects } from '@/components/looks/synthwave-pages';
import { DuneProjects } from '@/components/looks/dune-pages';
import { getContent } from '@/lib/content';
import { siteUrl } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Projects — Boda Madhukar Reddy',
  description: 'IoT data platforms, developer tooling, video conferencing, RAG systems and e-commerce builds for Jockey, Speedo, Manyavar and more.',
  alternates: { canonical: '/projects' },
};

export default async function ProjectsPage() {
  const { posts, keyProjects, clientProjects } = await getContent();
  const base = siteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Projects', item: `${base}/projects` },
    ],
  };

  return (
    <PageShell
      eyebrow="Projects"
      title="Selected work."
      description="Systems built from scratch, plus the e-commerce portals and integrations I've led."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <EditorialCaseFiles keyProjects={keyProjects} clientProjects={clientProjects} />
      <ArcticProjects keyProjects={keyProjects} clientProjects={clientProjects} />
      <SynthwaveProjects keyProjects={keyProjects} clientProjects={clientProjects} />
      <DuneProjects keyProjects={keyProjects} clientProjects={clientProjects} />
      <div className="classic-only">
        <Projects keyProjects={keyProjects} clientProjects={clientProjects} />
      </div>

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
      <EditorialNext from="/projects" />
    </PageShell>
  );
}
