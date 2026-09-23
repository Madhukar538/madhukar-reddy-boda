import hljs from 'highlight.js/lib/core';
import csharp from 'highlight.js/lib/languages/csharp';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import { blogs, type BlogPost } from '@/data/blogs';

/**
 * Server-side blog helpers: ordering, topics, related posts, and turning a
 * post's stored HTML into what the reader renders (heading anchors, a table
 * of contents and syntax-highlighted code, with no client-side highlighter).
 */

const LANGUAGES = { csharp, javascript, typescript, json, bash, yaml, sql, dockerfile };
for (const [name, lang] of Object.entries(LANGUAGES)) hljs.registerLanguage(name, lang);

const LABELS: Record<string, string> = {
  csharp: 'C#',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  json: 'JSON',
  bash: 'Shell',
  yaml: 'YAML',
  sql: 'SQL',
  hcl: 'Terraform',
  dockerfile: 'Dockerfile',
};

export type TocItem = { id: string; text: string; level: 2 | 3 };

export type RenderedPost = { html: string; toc: TocItem[]; words: number };

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const decode = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const plainText = (html: string) => decode(html).replace(/\s+/g, ' ').trim();

/** Newest first. */
export const posts: BlogPost[] = [...blogs].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const isoDate = (post: BlogPost) => new Date(Date.parse(post.date)).toISOString();

export function renderPost(post: BlogPost): RenderedPost {
  const toc: TocItem[] = [];
  const used = new Set<string>();

  let html = post.content.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level: string, inner: string) => {
    const text = plainText(inner);
    let id = slugify(text) || 'section';
    for (let n = 2; used.has(id); n++) id = `${slugify(text)}-${n}`;
    used.add(id);
    toc.push({ id, text, level: Number(level) as 2 | 3 });
    return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}" aria-label="Link to this section">#</a>${inner}</h${level}>`;
  });

  // Code blocks carry class="language-x"; the rest are ASCII diagrams or plain text.
  html = html.replace(/<pre(?: class="language-([a-z]+)")?>([\s\S]*?)<\/pre>/g, (_, lang: string | undefined, inner: string) => {
    const source = decode(inner).replace(/^\n+|\s+$/g, '');
    const known = lang && hljs.getLanguage(lang);
    const body = known ? hljs.highlight(source, { language: lang, ignoreIllegals: true }).value : escapeHtml(source);
    const kind = lang ? 'code' : /[─│▶◀┌└├]/.test(source) ? 'diagram' : 'text';
    const label = lang ? LABELS[lang] ?? lang : kind === 'diagram' ? 'Diagram' : 'Text';
    return `<figure class="code-block" data-kind="${kind}"><figcaption>${label}</figcaption><pre><code class="hljs">${body}</code></pre></figure>`;
  });

  return { html, toc, words: plainText(post.content).split(' ').length };
}

/** Posts sharing the most tags (then category), newest first on ties. */
export function relatedPosts(post: BlogPost, count = 3) {
  return posts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      post: p,
      score: p.tags.filter((t) => post.tags.includes(t)).length * 2 + (p.category === post.category ? 1 : 0),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((r) => r.post);
}

/** Older and newer neighbours in date order. */
export function adjacentPosts(post: BlogPost) {
  const i = posts.findIndex((p) => p.slug === post.slug);
  return { newer: posts[i - 1] ?? null, older: posts[i + 1] ?? null };
}

export type Topic = { slug: string; name: string; kind: 'category' | 'tag'; count: number };

/** Categories first, then tags used by more than one post, then the rest. */
export function allTopics(): Topic[] {
  const map = new Map<string, Topic>();
  const add = (name: string, kind: Topic['kind']) => {
    const slug = slugify(name);
    const existing = map.get(slug);
    if (existing) existing.count++;
    else map.set(slug, { slug, name, kind, count: 1 });
  };
  for (const p of posts) {
    add(p.category, 'category');
    for (const t of p.tags) if (slugify(t) !== slugify(p.category)) add(t, 'tag');
  }
  return [...map.values()].sort(
    (a, b) => (a.kind === b.kind ? b.count - a.count || a.name.localeCompare(b.name) : a.kind === 'category' ? -1 : 1)
  );
}

export function postsForTopic(slug: string) {
  return posts.filter((p) => slugify(p.category) === slug || p.tags.some((t) => slugify(t) === slug));
}

/** Compact data the client-side search and cards need. */
export type PostSummary = Pick<BlogPost, 'slug' | 'title' | 'excerpt' | 'date' | 'readTime' | 'category' | 'tags'> & {
  text: string;
};

export const summaries = (list = posts): PostSummary[] =>
  list.map(({ slug, title, excerpt, date, readTime, category, tags, content }) => ({
    slug,
    title,
    excerpt,
    date,
    readTime,
    category,
    tags,
    text: plainText(content).toLowerCase(),
  }));

/** Absolute site URL for metadata, feeds and social cards. SITE_URL overrides it (e.g. for a staging deploy). */
export const siteUrl = () => (process.env.SITE_URL || 'https://dhucar.in').replace(/\/$/, '');
