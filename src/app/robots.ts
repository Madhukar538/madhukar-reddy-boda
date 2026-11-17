import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/blog';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/ticket/'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
