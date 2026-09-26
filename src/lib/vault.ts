import type { BlogPost } from '@/data/blogs';
import { clientProjects, keyProjects, rdProjects } from '@/data/profile';
import { allTopics, posts, postsForTopic, slugify } from '@/lib/blog';
import { buildKnowledgeGraph, type KnowledgeGraph } from '@/lib/knowledge-graph';
import { anchorId } from '@/lib/utils';

/**
 * The site as an Obsidian-style vault: every post, project, experiment,
 * topic and page is a "note" with a URL. Feeds the quick switcher, hover
 * previews, linked mentions and each post's local graph. Server-side only.
 */

export type NoteType = 'post' | 'project' | 'lab' | 'client' | 'topic' | 'page';

export type Note = { href: string; title: string; type: NoteType; meta: string; excerpt: string };

const clip = (text: string, max = 220) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

const PAGES: Note[] = [
  { href: '/', title: 'Blog', type: 'page', meta: 'Page', excerpt: 'Every post, newest first, with search and category filters.' },
  { href: '/topics', title: 'Topics', type: 'page', meta: 'Page', excerpt: 'Posts grouped by area and by tool.' },
  { href: '/about', title: 'About', type: 'page', meta: 'Page', excerpt: 'Who I am, the stack I use and how to reach me.' },
  { href: '/experience', title: 'Experience', type: 'page', meta: 'Page', excerpt: 'Current role, grouped contributions and the client timeline.' },
  { href: '/projects', title: 'Projects', type: 'page', meta: 'Page', excerpt: 'Featured systems, more builds, and e-commerce client work.' },
  { href: '/lab', title: 'R&D Lab', type: 'page', meta: 'Page', excerpt: 'Experiments, proofs of concept and research, filterable by status.' },
  { href: '/graph', title: 'Knowledge graph', type: 'page', meta: 'Page', excerpt: 'Everything on the site, linked through the technologies it shares.' },
  { href: '/ai', title: 'Connect your AI (MCP)', type: 'page', meta: 'Page', excerpt: 'Query this portfolio from Claude or any MCP client.' },
  { href: '/fix-a-bug', title: 'Fix a bug', type: 'page', meta: 'Page', excerpt: 'Describe a problem you are stuck on and I will take a look.' },
];

/** Every note on the site. */
export function vaultNotes(): Note[] {
  return [
    ...posts.map((p) => ({
      href: `/blog/${p.slug}`,
      title: p.title,
      type: 'post' as const,
      meta: `${p.category} · ${p.date} · ${p.readTime}`,
      excerpt: clip(p.excerpt),
    })),
    ...keyProjects.map((p) => ({
      href: `/projects#${anchorId(p.title)}`,
      title: p.title,
      type: 'project' as const,
      meta: `Project · ${p.tech.slice(0, 3).join(', ')}`,
      excerpt: clip(p.description),
    })),
    ...clientProjects.map((p) => ({
      href: `/projects#${anchorId(p.title)}`,
      title: p.title,
      type: 'client' as const,
      meta: `Client · ${p.duration}`,
      excerpt: clip(p.description),
    })),
    ...rdProjects.map((p) => ({
      href: `/lab#${anchorId(p.title)}`,
      title: p.title,
      type: 'lab' as const,
      meta: `Lab · ${p.status.toLowerCase()}`,
      excerpt: clip(p.description),
    })),
    ...allTopics().map((t) => ({
      href: `/topics/${t.slug}`,
      title: t.name,
      type: 'topic' as const,
      meta: `${t.kind === 'category' ? 'Area' : 'Topic'} · ${t.count} ${t.count === 1 ? 'post' : 'posts'}`,
      excerpt: clip(postsForTopic(t.slug).map((p) => p.title).join(' · ')),
    })),
    ...PAGES,
  ];
}

export type NoteLink = { href: string; title: string; type: NoteType; via?: string[] };

/**
 * Obsidian's link panes for a post. Backlinks: projects and experiments
 * that point at it as their write-up, then posts that share its tags
 * (the "unlinked mentions" of a vault without explicit links). Outgoing:
 * its category and tags as topic notes.
 */
export function postLinks(post: BlogPost): { backlinks: NoteLink[]; mentions: NoteLink[]; outgoing: NoteLink[] } {
  const backlinks: NoteLink[] = [
    ...keyProjects
      .filter((p) => p.post === post.slug)
      .map((p) => ({ href: `/projects#${anchorId(p.title)}`, title: p.title, type: 'project' as const })),
    ...rdProjects
      .filter((p) => p.post === post.slug)
      .map((p) => ({ href: `/lab#${anchorId(p.title)}`, title: p.title, type: 'lab' as const })),
  ];

  const mine = new Set(post.tags.map(slugify));
  const mentions: NoteLink[] = posts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, shared: p.tags.filter((t) => mine.has(slugify(t))) }))
    .filter(({ shared }) => shared.length > 0)
    .sort((a, b) => b.shared.length - a.shared.length)
    .slice(0, 6)
    .map(({ p, shared }) => ({ href: `/blog/${p.slug}`, title: p.title, type: 'post' as const, via: shared }));

  const outgoing: NoteLink[] = [post.category, ...post.tags]
    .filter((name, i, all) => all.findIndex((n) => slugify(n) === slugify(name)) === i)
    .map((name) => ({ href: `/topics/${slugify(name)}`, title: name, type: 'topic' as const }));

  return { backlinks, mentions, outgoing };
}

export type LocalGraph = KnowledgeGraph & { center: string };

/**
 * A post's neighbourhood in the knowledge graph, like Obsidian's local graph
 * at depth 2: the post, its technologies and write-up links, then the notes
 * that share those technologies (the most-connected ones, capped).
 */
export function localGraph(slug: string, maxNodes = 22): LocalGraph {
  const graph = buildKnowledgeGraph();
  const center = `post:${slug}`;
  const neighbours = (id: string) =>
    graph.links.flatMap((l) => (l.source === id ? [l.target] : l.target === id ? [l.source] : []));

  const first = new Set(neighbours(center));
  const score = new Map<string, number>();
  first.forEach((id) =>
    neighbours(id).forEach((n) => {
      if (n !== center && !first.has(n)) score.set(n, (score.get(n) ?? 0) + 1);
    })
  );
  const second = [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(0, maxNodes - 1 - first.size))
    .map(([id]) => id);

  const keep = new Set([center, ...first, ...second]);
  return {
    center,
    // Only what the graph draws; descriptions would bloat every post's payload.
    nodes: graph.nodes.filter((n) => keep.has(n.id)).map(({ id, type, label, href, meta }) => ({ id, type, label, href, meta })),
    links: graph.links.filter((l) => keep.has(l.source) && keep.has(l.target)),
  };
}
