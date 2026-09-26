import { getContent } from '@/lib/content';
import { vaultNotes } from '@/lib/vault';

// Every note on the site, for the quick switcher and hover previews.
// Fetched only when one of them is first used.
// Rendered per request from the tagged data cache (lib/content.ts), so it is
// current as soon as content changes; static route handlers aren't revalidated by tag.
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(vaultNotes(await getContent()));
}
