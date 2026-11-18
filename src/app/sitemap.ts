import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/blog';
import { getSiteMap } from '@/lib/site-map';

// Rendered per request from the tagged data cache (lib/content.ts), so it is
// current as soon as content changes; static route handlers aren't revalidated by tag.
export const dynamic = 'force-dynamic';

/** How much each kind of page matters to search engines, and how often it changes. */
const WEIGHT: Record<string, { priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }> = {
  pages: { priority: 0.7, changeFrequency: 'monthly' },
  'case-studies': { priority: 0.8, changeFrequency: 'monthly' },
  writing: { priority: 0.9, changeFrequency: 'monthly' },
  topics: { priority: 0.5, changeFrequency: 'weekly' },
};

/** The same list as the /sitemap page (lib/site-map.ts), minus the files for machines. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sections = await getSiteMap();
  const base = siteUrl();
  const latest = sections.find((s) => s.id === 'writing')?.links[0]?.date;
  const isoDay = (date?: string) => (date ? new Date(date).toISOString().slice(0, 10) : undefined);
  return sections
    .filter((s) => WEIGHT[s.id])
    .flatMap((s) =>
      s.links.map((link) => ({
        url: link.path === '/' ? base : `${base}${link.path}`,
        lastModified: link.path === '/' ? isoDay(latest) : isoDay(link.date),
        priority: link.path === '/' ? 1.0 : WEIGHT[s.id].priority,
        changeFrequency: link.path === '/' ? ('daily' as const) : WEIGHT[s.id].changeFrequency,
      })),
    );
}
