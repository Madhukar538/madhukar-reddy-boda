import type { Note } from '@/lib/vault';

export type { Note };

let pending: Promise<Note[]> | null = null;

/** The site's note index (/vault.json), fetched once on first use. */
export function loadVault() {
  pending ??= fetch('/vault.json')
    .then((r) => {
      if (!r.ok) throw new Error(`vault.json ${r.status}`);
      return r.json() as Promise<Note[]>;
    })
    .catch((error) => {
      pending = null;
      throw error;
    });
  return pending;
}

/** Finds the note a site link points at, e.g. "/blog/x" or "/lab#y". */
export function findNote(notes: Note[], href: string) {
  const url = new URL(href, window.location.origin);
  const key = url.pathname.replace(/\/$/, '') + url.hash;
  return notes.find((n) => n.href === (key || '/')) ?? notes.find((n) => n.href === url.pathname);
}

/** Opens the quick switcher from anywhere (nav buttons, other components). */
export const openQuickSwitcher = () => window.dispatchEvent(new Event('vault:open'));
