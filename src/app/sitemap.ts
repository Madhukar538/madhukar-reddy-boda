import type { MetadataRoute } from 'next';
import { allTopics, isoDate, siteUrl } from '@/lib/blog';
import { getContent } from '@/lib/content';
import { caseStudies } from '@/data/case-studies';

// Rendered per request from the tagged data cache (lib/content.ts), so it is
// current as soon as content changes; static route handlers aren't revalidated by tag.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts } = await getContent();
  const base = siteUrl();
  const latest = isoDate(posts[0]);
  const pages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/topics', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/experience', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/projects', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/lab', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/lab/hybrid-search', priority: 0.85, changeFrequency: 'monthly' as const },
    { path: '/work-with-me', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/fix-a-bug', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/graph', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/ai', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/status', priority: 0.4, changeFrequency: 'daily' as const },
  ];
  return [
    ...pages.map(({ path, priority, changeFrequency }) => ({
      url: `${base}${path}`,
      lastModified: path === '' ? latest : undefined,
      priority,
      changeFrequency,
    })),
    ...caseStudies.map((c) => ({
      url: `${base}/projects/${c.slug}`,
      priority: 0.8,
      changeFrequency: 'monthly' as const,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: isoDate(p),
      priority: 0.9,
      changeFrequency: 'monthly' as const,
    })),
    ...allTopics(posts).map((t) => ({
      url: `${base}/topics/${t.slug}`,
      priority: 0.5,
      changeFrequency: 'weekly' as const,
    })),
  ];
}
