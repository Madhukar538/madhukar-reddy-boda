import type { BlogPost } from '@/data/blogs';

/** Blog HTML → readable Markdown-ish text for AI clients and llms.txt. */
export function htmlToText(html: string): string {
  return html
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => `\n\`\`\`\n${code.trim()}\n\`\`\`\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .split('\n')
    .reduce<{ inCode: boolean; lines: string[] }>(
      (acc, line) => {
        // The source HTML is indented; keep indentation only inside code blocks.
        if (line.trim() === '```') acc.inCode = !acc.inCode;
        acc.lines.push(acc.inCode ? line : line.trimStart());
        return acc;
      },
      { inCode: false, lines: [] }
    )
    .lines.join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function postToText(post: BlogPost): string {
  return [
    `# ${post.title}`,
    `${post.date} · ${post.readTime} · ${post.category}`,
    `Tags: ${post.tags.join(', ')}`,
    '',
    post.excerpt,
    '',
    htmlToText(post.content),
  ].join('\n');
}

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .split(/[^a-z0-9#+.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter((t) => t.length > 1);

/**
 * Small field-weighted keyword search over the blog. Title and tag matches
 * count most, then the excerpt, then the body.
 */
export function searchBlog(posts: BlogPost[], query: string, limit = 5) {
  const terms = Array.from(new Set(tokenize(query)));
  if (terms.length === 0) return [];

  return posts
    .map((post) => {
      const fields: [string[], number][] = [
        [tokenize(post.title), 5],
        [tokenize(post.tags.join(' ')), 4],
        [tokenize(`${post.category} ${post.excerpt}`), 2],
        [tokenize(post.content), 1],
      ];
      let score = 0;
      let matched = 0;
      for (const term of terms) {
        let termScore = 0;
        for (const [tokens, weight] of fields) {
          const hits = tokens.filter((t) => t === term || (term.length > 3 && t.startsWith(term))).length;
          termScore += weight * Math.log1p(hits);
        }
        if (termScore > 0) matched += 1;
        score += termScore;
      }
      // Favour posts that match more of the query's distinct terms.
      return { post, score: score * (matched / terms.length) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post, score }) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      category: post.category,
      tags: post.tags,
      excerpt: post.excerpt,
      url: `/blog/${post.slug}`,
      score: Math.round(score * 100) / 100,
    }));
}
