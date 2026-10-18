'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorMessage } from '@/lib/admin/api';
import type { ContentSyncItem, ContentSyncResult } from '@/lib/admin/types';
import { useAdmin } from '@/components/admin/session';
import { Notice, Panel, secondaryButton } from '@/components/admin/ui';

const key = (i: Pick<ContentSyncItem, 'type' | 'id'>) => `${i.type}:${i.id}`;
const typeLabel = { post: 'Post', project: 'Project', profile: 'Profile' } as const;

/**
 * "Sync new content": after a deploy, adds the posts and projects that exist in the
 * site's code but not yet in the database. New items are ticked by default; changed
 * ones (where the database differs, e.g. edited here) are listed with the fields that
 * differ and only applied when ticked, so admin edits are never overwritten silently.
 */
export function ContentSync() {
  const { call } = useAdmin();
  const [items, setItems] = useState<ContentSyncItem[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const load = useCallback(() => {
    setError('');
    call<ContentSyncItem[]>('GetContentSync')
      .then((list) => {
        setItems(list);
        setChosen(new Set(list.filter((i) => i.change === 'new').map(key)));
      })
      .catch((e) => setError(errorMessage(e)));
  }, [call]);

  useEffect(load, [load]);

  const toggle = (k: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const apply = async () => {
    if (!items) return;
    setBusy(true);
    setError('');
    setDone('');
    try {
      const selected = items.filter((i) => chosen.has(key(i))).map(({ type, id }) => ({ type, id }));
      const result = await call<ContentSyncResult>('ApplyContentSync', { items: selected });
      setDone(
        `${result.applied} ${result.applied === 1 ? 'item' : 'items'} synced.` +
          (result.isRevalidated ? ' The site is updated.' : " The site didn't confirm the refresh, so it will update within a few minutes.")
      );
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // Nothing to show until there is something to sync (or an error/confirmation).
  if (!error && !done && (!items || items.length === 0)) return null;

  return (
    <Panel
      title="Sync new content"
      description="Posts and projects that are in the site's latest deploy but not yet live. New items are selected; changed items would replace what is saved here, so they are only applied if you tick them."
      actions={
        <button type="button" onClick={load} className={secondaryButton} aria-label="Check again">
          <RefreshCw className="h-4 w-4" />
        </button>
      }
    >
      {error && <Notice>{error}</Notice>}
      {done && <Notice kind="success">{done}</Notice>}
      {items && items.length > 0 && (
        <>
          <ul className="divide-y divide-foreground/10">
            {items.map((item) => {
              const k = key(item);
              return (
                <li key={k}>
                  <label className="flex cursor-pointer items-start gap-3 py-3">
                    <input type="checkbox" checked={chosen.has(k)} onChange={() => toggle(k)} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" />
                    <span className="flex-1">
                      <span className="block font-medium text-foreground">{item.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {typeLabel[item.type]} ·{' '}
                        <span className={cn('font-medium', item.change === 'new' ? 'text-[hsl(var(--sys-green))]' : 'text-[hsl(var(--sys-orange))]')}>
                          {item.change === 'new' ? 'New' : `Changed: ${item.fields.join(', ')}`}
                        </span>
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={apply} disabled={busy || chosen.size === 0} className="tinted-button mt-4 disabled:opacity-50">
            {busy ? 'Syncing…' : `Sync ${chosen.size} ${chosen.size === 1 ? 'item' : 'items'}`}
          </button>
        </>
      )}
    </Panel>
  );
}
