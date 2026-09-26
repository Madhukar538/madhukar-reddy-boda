import { getContent } from '@/lib/content';
import { buildKnowledgeGraph } from '@/lib/knowledge-graph';

// Data for desktop mode, fetched only when a visitor switches it on,
// so normal pages don't carry every post's HTML.
// Rendered per request from the tagged data cache (lib/content.ts), so it is
// current as soon as content changes; static route handlers aren't revalidated by tag.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { posts, ...content } = await getContent();
  return Response.json({
    posts: posts.map(({ slug, title, date, readTime, category, excerpt, content }) => ({
      slug, title, date, readTime, category, excerpt, content,
    })),
    graph: buildKnowledgeGraph({ posts, ...content }),
    content,
  });
}
