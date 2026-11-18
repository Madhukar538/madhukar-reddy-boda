import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/portfolio/page-shell';
import { pageOpenGraph } from '@/lib/seo';
import { getPage } from '@/lib/content';

/**
 * Any path this site has no built-in page for. A page made in the admin (Admin → Pages) answers
 * at its own address, /<slug>; everything else gets this site's own 404 (not-found.tsx), with its
 * nav, as there is no app-wide 404 page with more than one root layout. Other sites' paths
 * (/sites/<domain>/...) match their own, more specific catch-all instead.
 */

type Props = { params: Promise<{ missing: string[] }> };

/** The admin page at this address, if the path is a single segment and one is published there. */
async function pageFor(params: Props['params']) {
  const { missing } = await params;
  return missing.length === 1 ? getPage(missing[0]) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await pageFor(params);
  if (!page) return {};
  return {
    title: `${page.title} — Boda Madhukar Reddy`,
    description: page.description || undefined,
    alternates: { canonical: `/${page.slug}` },
    openGraph: pageOpenGraph(`/${page.slug}`),
  };
}

export default async function CatchAll({ params }: Props) {
  const page = await pageFor(params);
  if (!page) notFound();
  return (
    <PageShell eyebrow="Page" title={page.title} description={page.description || undefined}>
      {/* Sanitized by the API when saved (PostBAL.SanitizeHtml), like a post's body. */}
      <div className="article-body max-w-3xl" dangerouslySetInnerHTML={{ __html: page.content }} />
    </PageShell>
  );
}
