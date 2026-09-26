'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, FileText, FlaskConical, FolderKanban, Hash, LayoutGrid, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadVault, type Note } from '@/lib/vault-client';

const ICONS: Record<Note['type'], typeof FileText> = {
  post: FileText,
  project: FolderKanban,
  client: FolderKanban,
  lab: FlaskConical,
  topic: Hash,
  page: LayoutGrid,
};

const LIMIT = 12;

/** Every term must match; title hits (especially at a word start) rank first. */
function rank(notes: Note[], query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) {
    // Nothing typed: pages, then the newest posts, like Obsidian's recent files.
    return [...notes.filter((n) => n.type === 'page'), ...notes.filter((n) => n.type === 'post')].slice(0, LIMIT);
  }
  return notes
    .map((note) => {
      const title = note.title.toLowerCase();
      const rest = `${note.meta} ${note.excerpt}`.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(title)) score += 4;
        else if (title.includes(t)) score += 3;
        else if (rest.includes(t)) score += 1;
        else return null;
      }
      return { note, score: score - title.length / 200 };
    })
    .filter((r): r is { note: Note; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMIT)
    .map((r) => r.note);
}

export default function QuickSwitcherDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    loadVault().then(setNotes).catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    setQuery('');
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => returnFocus.current?.focus?.();
  }, [open]);

  const results = useMemo(() => (notes ? rank(notes, query) : []), [notes, query]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const go = (note: Note | undefined) => {
    if (!note) return;
    onClose();
    router.push(note.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      // Keep focus in the dialog; the list is driven by the arrow keys.
      e.preventDefault();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-start justify-center bg-black/35 px-3 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick switcher"
        className="glass glass-strong w-full max-w-xl overflow-hidden"
        style={{ ['--glass-radius' as string]: '1.25rem' }}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-foreground/10 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a post, project, experiment or topic…"
            aria-label="Search notes"
            role="combobox"
            aria-expanded="true"
            aria-controls="quick-switcher-results"
            aria-activedescendant={results[active] ? `qs-${active}` : undefined}
            className="w-full bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/80 outline-none"
          />
          <kbd className="hidden rounded-md px-1.5 text-[11px] font-medium text-muted-foreground ring-1 ring-foreground/15 sm:inline">esc</kbd>
        </div>

        <ul id="quick-switcher-results" ref={listRef} role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {!notes && !failed && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Loading notes…</li>}
          {failed && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Couldn&apos;t load the notes. Try again in a moment.</li>}
          {notes && results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No notes match &ldquo;{query}&rdquo;.</li>
          )}
          {results.map((note, i) => {
            const Icon = ICONS[note.type];
            return (
              <li
                key={note.href}
                id={`qs-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === active}
                onMouseMove={() => setActive(i)}
                onClick={() => go(note)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5',
                  i === active ? 'bg-primary/15' : 'hover:bg-foreground/[0.05]'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', i === active ? 'text-primary' : 'text-muted-foreground')} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{note.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{note.meta}</span>
                </span>
                {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 border-t border-foreground/10 px-4 py-2 text-[11px] text-muted-foreground">
          <span><kbd className="font-sans">↑↓</kbd> to navigate</span>
          <span><kbd className="font-sans">↵</kbd> to open</span>
          <span><kbd className="font-sans">esc</kbd> to dismiss</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
