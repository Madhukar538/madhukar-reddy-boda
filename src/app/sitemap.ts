import type { MetadataRoute } from 'next';
import { allTopics, isoDate, posts, siteUrl } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const latest = isoDate(posts[0]);
  const pages = ['', '/topics', '/about', '/experience', '/projects', '/lab', '/fix-a-bug', '/graph', '/ai'];
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, lastModified: path === '' ? latest : undefined, priority: path === '' ? 1 : 0.6 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: isoDate(p), priority: 0.9 })),
    ...allTopics().map((t) => ({ url: `${base}/topics/${t.slug}`, priority: 0.4 })),
  ];
}
