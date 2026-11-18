'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import { CONTENT_TAGS } from '@/lib/content-tags';
import { useAdmin } from './session';

/**
 * "Refresh site": clears every cached piece of the site's content (posts, projects, profile, story,
 * themes, bug log, pages) so the next visit reads it fresh from the API. Saves already do this for
 * what they change; this is for any time something looks stale. Uses /api/revalidate with the
 * admin's session, so only a signed-in admin can do it.
 */
export function RefreshSiteButton() {
  const { refreshSite } = useAdmin();
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');

  // The result shows for a few seconds, then the button is back to normal.
  useEffect(() => {
    if (state !== 'done' && state !== 'failed') return;
    const timer = window.setTimeout(() => setState('idle'), 4000);
    return () => window.clearTimeout(timer);
  }, [state]);

  const refresh = async () => {
    setState('busy');
    setState((await refreshSite([...CONTENT_TAGS])) ? 'done' : 'failed');
  };

  const Icon = state === 'busy' ? Loader2 : state === 'done' ? Check : state === 'failed' ? TriangleAlert : RefreshCw;
  const label = state === 'busy' ? 'Refreshing…' : state === 'done' ? 'Site refreshed' : state === 'failed' ? "Couldn't refresh" : 'Refresh site';
  return (
    <button
      type="button"
      onClick={refresh}
      disabled={state === 'busy'}
      title="Clear the site's cached content so visitors get the latest"
      className={
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-70 ' +
        (state === 'done'
          ? 'text-[hsl(var(--sys-green))]'
          : state === 'failed'
            ? 'text-[hsl(var(--destructive))]'
            : 'text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground')
      }
    >
      <Icon className={`h-4 w-4 ${state === 'busy' ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline" aria-live="polite">{label}</span>
    </button>
  );
}
