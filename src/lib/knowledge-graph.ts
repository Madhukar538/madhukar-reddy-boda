import { blogs } from '@/data/blogs';
import { keyProjects, rdProjects } from '@/data/profile';
import { anchorId } from '@/lib/utils';

/**
 * Builds the knowledge graph from the shared portfolio data:
 * projects, Lab experiments and blog posts, linked through the
 * technologies they share (and posts linked to the work they write up).
 */

export type GraphNodeType = 'project' | 'lab' | 'post' | 'tech';

export type GraphNode = {
  id: string;
  type: GraphNodeType;
  label: string;
  description?: string;
  href?: string;
  meta?: string;
};

export type GraphLink = { source: string; target: string };

export type KnowledgeGraph = { nodes: GraphNode[]; links: GraphLink[] };

// Merge spelling variants into one technology node.
const ALIASES: Record<string, string> = {
  '.net core': '.NET',
  '.net 10': '.NET',
  '.net 8': '.NET',
  'asp.net core': '.NET',
  'next.js 16': 'Next.js',
  'solr 9': 'Solr',
  llm: 'LLMs',
  'vector db': 'Vector search',
  'vector search': 'Vector search',
  'onnx runtime': 'ONNX',
  k3s: 'Kubernetes / K3s',
  kubernetes: 'Kubernetes / K3s',
  'gc optimization': 'Performance',
  indexing: 'Performance',
  'load testing': 'k6',
  'memory cache': 'Caching',
  homelab: 'Self-hosting',
  'self-hosting': 'Self-hosting',
};

const canonical = (tech: string) => ALIASES[tech.toLowerCase()] ?? tech;

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function buildKnowledgeGraph(minTechLinks = 2): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const techLinks: { item: string; tech: string }[] = [];
  const links: GraphLink[] = [];

  const addItem = (node: GraphNode, techs: string[]) => {
    nodes.push(node);
    new Set(techs.map(canonical)).forEach((tech) => techLinks.push({ item: node.id, tech }));
  };

  keyProjects.forEach((p) =>
    addItem(
      { id: `project:${slug(p.title)}`, type: 'project', label: p.title, description: p.description, href: `/projects#${anchorId(p.title)}`, meta: 'Key project' },
      p.tech
    )
  );

  rdProjects.forEach((p) =>
    addItem(
      { id: `lab:${slug(p.title)}`, type: 'lab', label: p.title, description: p.description, href: `/lab#${anchorId(p.title)}`, meta: `Lab · ${p.status}` },
      p.tech
    )
  );

  blogs.forEach((b) =>
    addItem(
      { id: `post:${b.slug}`, type: 'post', label: b.title, description: b.excerpt, href: `/blog/${b.slug}`, meta: `${b.category} · ${b.date}` },
      b.tags
    )
  );

  // Keep only technologies shared by enough items to form real connections.
  const counts = new Map<string, number>();
  techLinks.forEach(({ tech }) => counts.set(tech, (counts.get(tech) ?? 0) + 1));
  counts.forEach((count, tech) => {
    if (count < minTechLinks) return;
    nodes.push({ id: `tech:${slug(tech)}`, type: 'tech', label: tech, meta: `${count} connections` });
  });
  techLinks.forEach(({ item, tech }) => {
    if ((counts.get(tech) ?? 0) >= minTechLinks) links.push({ source: item, target: `tech:${slug(tech)}` });
  });

  // Posts that write up a project or experiment.
  [...keyProjects.map((p) => ({ p, prefix: 'project' })), ...rdProjects.map((p) => ({ p, prefix: 'lab' }))].forEach(
    ({ p, prefix }) => {
      if (p.post) links.push({ source: `${prefix}:${slug(p.title)}`, target: `post:${p.post}` });
    }
  );

  return { nodes, links };
}
