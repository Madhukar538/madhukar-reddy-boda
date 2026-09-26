import type { MetadataRoute } from 'next';
import { allTopics, isoDate, siteUrl } from '@/lib/blog';
import { getContent } from '@/lib/content';

// Rendered per request from the tagged data cache (lib/content.ts), so it is
// current as soon as content changes; static route handlers aren't revalidated by tag.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts } = await getContent();
  const base = siteUrl();
  const latest = isoDate(posts[0]);
  const pages = ['', '/topics', '/about', '/experience', '/projects', '/lab', '/fix-a-bug', '/graph', '/ai'];
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, lastModified: path === '' ? latest : undefined, priority: path === '' ? 1 : 0.6 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: isoDate(p), priority: 0.9 })),
    ...allTopics(posts).map((t) => ({ url: `${base}/topics/${t.slug}`, priority: 0.4 })),
  ];
}
