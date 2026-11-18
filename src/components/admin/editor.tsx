'use client';

import { useEffect, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Loader2, Save, Trash2, X } from 'lucide-react';
import type { SaveResult } from '@/lib/admin/types';
import { Notice, dangerButton } from './ui';

/** Warn before leaving a page with unsaved edits. */
export function useLeaveGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}

/** True once the live site has refreshed: by the API's own call, or else by asking the site directly. */
export const ensureRefreshed = async (result: SaveResult | null, tags: string[], refreshSite: (tags: string[]) => Promise<boolean>) =>
  (result?.isRevalidated ?? false) || (await refreshSite(tags));

export const savedMessage = (refreshed: boolean) =>
  refreshed ? 'Saved. The site has been refreshed.' : "Saved. The site couldn't be refreshed right now, so it will show within 5 minutes.";

export type Status = { kind: 'error' | 'success'; text: string } | null;

// A status that survives the move from /new to the saved item's URL, which remounts the editor.
let flash: Status = null;
export const setFlash = (status: Status) => {
  flash = status;
};
export const takeFlash = (): Status => {
  const status = flash;
  flash = null;
  return status;
};

/** Sticky save bar under the form: status message, delete and save. */
export function SaveBar({ busy, dirty, status, onDelete, extra }: { busy: 'save' | 'delete' | null; dirty: boolean; status: Status; onDelete?: () => void; extra?: ReactNode }) {
  return (
    <div className="glass glass-strong sticky bottom-24 z-20 mt-5 flex flex-wrap items-center gap-3 p-3 lg:bottom-4">
      <div className="min-w-0 flex-1">
        {status ? <Notice kind={status.kind}>{status.text}</Notice> : <span className="px-1 text-sm text-muted-foreground">{dirty ? 'Unsaved changes' : 'No changes'}</span>}
      </div>
      {extra}
      {onDelete && (
        <button type="button" onClick={onDelete} disabled={busy !== null} className={dangerButton}>
          {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete
        </button>
      )}
      <button type="submit" disabled={busy !== null || !dirty} className="tinted-button">
        {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </button>
    </div>
  );
}

// Posts store dates as "September 26, 2026"; the date picker uses 2026-09-26.
export const toInputDate = (date: string) => {
  const ms = Date.parse(`${date} UTC`);
  return Number.isNaN(ms) ? '' : new Date(ms).toISOString().slice(0, 10);
};

export const fromInputDate = (value: string) =>
  value ? new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';

/** The list with one item moved from one place to another (unchanged when the target is out of range). */
export const move = <T,>(list: T[], from: number, to: number) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/** One row of an editable list, with move up/down and remove buttons beside it. */
export function ListItem({ index, count, onMove, onRemove, children }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void; children: ReactNode }) {
  const icon = 'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground disabled:opacity-30';
  return (
    <div className="glass-inset flex gap-3 rounded-xl p-3">
      <div className="min-w-0 flex-1 space-y-3">{children}</div>
      <div className="flex shrink-0 flex-col">
        <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)} className={icon}><ArrowUp className="h-4 w-4" /></button>
        <button type="button" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(index + 1)} className={icon}><ArrowDown className="h-4 w-4" /></button>
        <button type="button" aria-label="Remove" onClick={onRemove} className={icon}><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
