import { blogs } from '@/data/blogs';
import { buildKnowledgeGraph } from '@/lib/knowledge-graph';

// Data for desktop mode, fetched only when a visitor switches it on,
// so normal pages don't carry every post's HTML. Built at deploy time.
export const dynamic = 'force-static';

export function GET() {
  return Response.json({
    posts: blogs.map(({ slug, title, date, readTime, category, excerpt, content }) => ({
      slug, title, date, readTime, category, excerpt, content,
    })),
    graph: buildKnowledgeGraph(),
  });
}
