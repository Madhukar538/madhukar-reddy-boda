import { isoDate, siteUrl } from '@/lib/blog';
import { getContent } from '@/lib/content';

// RSS 2.0 feed of every post, with the full HTML in content:encoded.
// Rendered per request from the tagged data cache (lib/content.ts), so it is
// current as soon as content changes; static route handlers aren't revalidated by tag.
export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

export async function GET() {
  const { posts } = await getContent();
  const base = siteUrl();
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/blog/${p.slug}</link>
      <guid isPermaLink="true">${base}/blog/${p.slug}</guid>
      <pubDate>${new Date(isoDate(p)).toUTCString()}</pubDate>
      <category>${esc(p.category)}</category>
      <description>${esc(p.excerpt)}</description>
      <content:encoded>${cdata(p.content)}</content:encoded>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Boda Madhukar Reddy — Engineering blog</title>
    <link>${base}</link>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    <description>.NET performance, self-hosted AI (RAG, MCP, hybrid search), load testing and homelab infrastructure.</description>
    <language>en</language>
    <lastBuildDate>${new Date(isoDate(posts[0])).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
