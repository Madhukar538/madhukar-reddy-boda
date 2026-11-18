import type { Metadata } from 'next';
import Link from 'next/link';
import { pageOpenGraph } from '@/lib/seo';
import { PageShell } from '@/components/portfolio/page-shell';
import { getSiteMap } from '@/lib/site-map';

export const metadata: Metadata = {
  title: 'Sitemap — Boda Madhukar Reddy',
  description: 'Every page on the site in one place: the pages, case studies, posts, topics and the feeds for machines.',
  alternates: { canonical: '/sitemap' },
  openGraph: pageOpenGraph('/sitemap'),
};

const day = (date: string) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Every public page, listed from the site itself (lib/site-map.ts): nothing here is kept by hand. */
export default async function SitemapPage() {
  const sections = await getSiteMap();
  const total = sections.reduce((sum, s) => sum + s.links.length, 0);

  return (
    <PageShell eyebrow="Sitemap" title="Everything on the site." description={`${total} links, kept up to date on their own as pages and posts are added.`}>
      <nav aria-label="Sections" className="mb-8 flex flex-wrap gap-2">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip hover:text-foreground transition-colors">
            {s.title} <span className="ml-1 text-muted-foreground">{s.links.length}</span>
          </a>
        ))}
      </nav>
      <div className="space-y-12">
        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-28">
            <h2 id={`${s.id}-title`} className="mb-4 border-b border-foreground/15 pb-2 text-2xl font-bold tracking-tight">
              {s.title}
            </h2>
            <ul className={s.id === 'topics' ? 'flex flex-wrap gap-x-5 gap-y-2' : 'grid gap-x-8 gap-y-4 md:grid-cols-2'}>
              {s.links.map((link) => (
                <li key={link.path}>
                  {s.id === 'files' ? (
                    <a href={link.path} className="font-medium text-foreground hover:text-primary transition-colors">
                      {link.title}
                    </a>
                  ) : (
                    <Link href={link.path} className="font-medium text-foreground hover:text-primary transition-colors">
                      {link.title}
                    </Link>
                  )}
                  {s.id !== 'topics' && (
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                      {link.path}
                      {link.date && ` · ${day(link.date)}`}
                    </span>
                  )}
                  {link.description && <span className="mt-1 block line-clamp-2 text-sm text-muted-foreground">{link.description}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
