'use client';

import { useEffect, type ReactNode } from 'react';
import { Loader2, Save, Trash2 } from 'lucide-react';
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

export const savedMessage = (result: SaveResult) =>
  result.isRevalidated
    ? 'Saved. The site has been refreshed.'
    : "Saved. The site didn't confirm the refresh, so it will update within the hour.";

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
