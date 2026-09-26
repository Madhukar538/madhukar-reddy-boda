import hljs from 'highlight.js/lib/core';
import csharp from 'highlight.js/lib/languages/csharp';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import type { HLJSApi, Language } from 'highlight.js';
import { blogs, countWords, type BlogPost } from '@/data/blogs';
import { CALLOUT_KINDS, calloutIcon, type CalloutKind } from '@/components/vault/callout-icons';

/**
 * Server-side blog helpers: ordering, topics, related posts, and turning a
 * post's stored HTML into what the reader renders (heading anchors, a table
 * of contents and syntax-highlighted code, with no client-side highlighter).
 */

// highlight.js ships no HCL, so Terraform gets a small grammar: blocks, attributes, strings with ${} interpolation.
const hcl = (hljs: HLJSApi): Language => ({
  name: 'HCL',
  aliases: ['terraform', 'tf'],
  keywords: { literal: 'true false null', keyword: 'for in if' },
  contains: [
    hljs.HASH_COMMENT_MODE,
    hljs.C_LINE_COMMENT_MODE,
    hljs.C_BLOCK_COMMENT_MODE,
    hljs.C_NUMBER_MODE,
    {
      scope: 'string',
      begin: '"',
      end: '"',
      contains: [hljs.BACKSLASH_ESCAPE, { scope: 'subst', begin: /\$\{/, end: /\}/ }],
    },
    // Block type: resource "a" "b" {  or  locals {
    { scope: 'keyword', begin: /\b[a-z_][\w-]*(?=(?:\s+"[^"\n]*")*\s*\{)/, relevance: 0 },
    { scope: 'attr', begin: /[a-z_][\w-]*(?=\s*=(?!=))/, relevance: 0 },
  ],
});

const LANGUAGES = { csharp, javascript, typescript, json, bash, yaml, sql, dockerfile, hcl };
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

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Elements whose text never gets a wikilink.
const NO_LINK = /^(a|code|pre|h[1-6]|figure|figcaption|kbd)$/;

/**
 * Obsidian-style [[wikilinks]]: the first mention of each of the post's tags
 * in body text links to that tag's topic note. Skips code, headings and
 * existing links.
 */
function linkMentions(html: string, tags: string[]) {
  const pending = tags
    .filter((t) => t.length > 1)
    .map((tag) => ({
      href: `/topics/${slugify(tag)}`,
      re: new RegExp(`(?<![\\w.#+-])${escapeRegExp(tag)}(?![\\w#+])`, 'i'),
    }));
  let skip = 0;
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      const tag = part.match(/^<(\/?)([a-z0-9]+)/i);
      if (tag) {
        if (NO_LINK.test(tag[2].toLowerCase()) && !part.endsWith('/>')) skip += tag[1] ? -1 : 1;
        return part;
      }
      if (skip > 0 || !pending.length) return part;
      for (let i = 0; i < pending.length; i++) {
        const { href, re } = pending[i];
        const match = part.match(re);
        if (!match || match.index === undefined) continue;
        pending.splice(i--, 1);
        const end = match.index + match[0].length;
        part = `${part.slice(0, match.index)}<a class="wikilink" href="${href}">${match[0]}</a>${part.slice(end)}`;
        // Don't search inside the link just inserted.
        break;
      }
      return part;
    })
    .join('');
}

/**
 * Obsidian callouts: a blockquote whose first paragraph starts with
 * [!type] Title becomes a callout box. [!type]- / [!type]+ make it
 * foldable (collapsed / expanded), as in Obsidian.
 */
function renderCallouts(html: string) {
  return html.replace(
    /<blockquote>\s*<p>\[!([a-z]+)\]([+-]?)\s*([\s\S]*?)<\/p>([\s\S]*?)<\/blockquote>/g,
    (_, type: string, fold: string, rawTitle: string, rest: string) => {
      const kind: CalloutKind = (CALLOUT_KINDS as readonly string[]).includes(type) ? (type as CalloutKind) : 'note';
      // Title is the first line; anything after a <br> belongs to the body.
      const [title, ...more] = rawTitle.split(/<br\s*\/?>/);
      const heading = `${calloutIcon(kind)}<span>${title.trim() || kind.charAt(0).toUpperCase() + kind.slice(1)}</span>`;
      const body = `${more.length ? `<p>${more.join('<br>')}</p>` : ''}${rest}`.trim();
      const content = body ? `<div class="callout-content">${body}</div>` : '';
      return fold
        ? `<details class="callout" data-callout="${kind}"${fold === '+' ? ' open' : ''}><summary class="callout-title">${heading}</summary>${content}</details>`
        : `<div class="callout" data-callout="${kind}"><div class="callout-title">${heading}</div>${content}</div>`;
    }
  );
}

export function renderPost(post: BlogPost): RenderedPost {
  const toc: TocItem[] = [];
  const used = new Set<string>();

  let html = renderCallouts(linkMentions(post.content, post.tags)).replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level: string, inner: string) => {
    const text = plainText(inner);
    let id = slugify(text) || 'section';
    for (let n = 2; used.has(id); n++) id = `${slugify(text)}-${n}`;
    used.add(id);
    toc.push({ id, text, level: Number(level) as 2 | 3 });
    // h2 sections can be folded, as in Obsidian (wired up in reader-chrome.tsx).
    const fold =
      level === '2' ? '<button type="button" class="fold-toggle" aria-expanded="true" aria-label="Fold section"></button>' : '';
    return `<h${level} id="${id}">${fold}<a class="heading-anchor" href="#${id}" aria-label="Link to this section">#</a>${inner}</h${level}>`;
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

  return { html, toc, words: countWords(post.content) };
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
