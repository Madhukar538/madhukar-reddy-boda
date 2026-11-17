import { getContent } from '@/lib/content';
import { searchText } from '@/lib/blog';

// The full text of every post, lower-cased, for the blog search box (components/blog/blog-index.tsx).
// Fetched only once someone starts searching, so pages don't carry every article in their HTML.
// Rendered per request from the tagged data cache (lib/content.ts), like rss.xml.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { posts } = await getContent();
  return Response.json(searchText(posts), {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400' },
  });
}
