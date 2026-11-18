import routes from '@/data/routes.generated.json';
import { caseStudies } from '@/data/case-studies';
import { allTopics } from '@/lib/blog';
import { getBugLog, getContent, getPages } from '@/lib/content';

/**
 * Every public page of the site, grouped, for the /sitemap page and sitemap.xml. Nothing here is
 * listed by hand: the pages come from the app's own folders (scripts/gen-routes.mjs, run before
 * each build, reads their titles and descriptions), and the posts, topics, case studies and bug
 * log from the content, and the pages made in the admin, so a new page or post appears on its own.
 * Server-side only.
 */

export type SiteMapLink = { path: string; title: string; description?: string; date?: string };
export type SiteMapSection = { id: string; title: string; links: SiteMapLink[] };

/** Plain names for the files for machines; anything new falls back to its file name. */
const FILE_TITLES: Record<string, string> = {
  '/rss.xml': 'RSS feed',
  '/sitemap.xml': 'XML sitemap, for search engines',
  '/llms.txt': 'llms.txt, a summary for AI assistants',
  '/llms-full.txt': 'llms-full.txt, every post for AI assistants',
};

export async function getSiteMap(): Promise<SiteMapSection[]> {
  const [{ posts }, bugLog, adminPages] = await Promise.all([getContent(), getBugLog(), getPages()]);
  const pages = routes.pages
    // The bug log answers 404 while it is empty; the sitemap page doesn't list itself.
    .filter((r) => !(r.path === '/bug-log' && bugLog.length === 0) && r.path !== '/sitemap')
    .map((r) => ({ path: r.path, title: r.path === '/' ? 'Home' : r.title, description: r.description || undefined }))
    // Pages made in the admin, by title after the built-in ones.
    .concat(adminPages.map((p) => ({ path: `/${p.slug}`, title: p.title, description: p.description || undefined })));

  const sections: SiteMapSection[] = [
    { id: 'pages', title: 'Pages', links: pages },
    {
      id: 'case-studies',
      title: 'Case studies',
      links: caseStudies.map((c) => ({ path: `/projects/${c.slug}`, title: c.title, description: c.summary })),
    },
    {
      id: 'writing',
      title: 'Writing',
      links: posts.map((p) => ({ path: `/blog/${p.slug}`, title: p.title, date: p.date })),
    },
    {
      id: 'topics',
      title: 'Topics',
      links: allTopics(posts).map((t) => ({ path: `/topics/${t.slug}`, title: `${t.name} (${t.count})` })),
    },
    {
      id: 'files',
      title: 'Feeds and files for machines',
      links: routes.files.map((f) => ({ path: f.path, title: FILE_TITLES[f.path] ?? f.path.slice(1) })),
    },
  ];
  return sections.filter((s) => s.links.length > 0);
}
