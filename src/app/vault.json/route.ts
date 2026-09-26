import { vaultNotes } from '@/lib/vault';

// Every note on the site, for the quick switcher and hover previews.
// Fetched only when one of them is first used. Built at deploy time.
export const dynamic = 'force-static';

export function GET() {
  return Response.json(vaultNotes());
}
