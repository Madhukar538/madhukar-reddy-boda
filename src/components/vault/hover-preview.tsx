'use client';

import { useEffect, useRef, useState } from 'react';
import { findNote, loadVault, type Note } from '@/lib/vault-client';

type Preview = { note: Note; top: number; left: number; above: boolean };

const WIDTH = 320;

/**
 * Obsidian's page preview: hovering an internal link inside an article, the
 * properties or the link panes shows a card for the note it points at.
 * Pointer devices only; the note index loads on the first hover.
 */
export function HoverPreview() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const showTimer = useRef(0);
  const hideTimer = useRef(0);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const linkFrom = (target: EventTarget | null) => {
      const a = (target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="/"]');
      if (!a || !a.closest('.article-body, [data-previews]')) return null;
      const url = new URL(a.href);
      // A link to the page you're on has nothing new to preview.
      if (url.pathname === window.location.pathname && !url.hash) return null;
      return a;
    };

    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest?.('.vault-preview')) {
        clearTimeout(hideTimer.current);
        return;
      }
      const a = linkFrom(e.target);
      if (!a) return;
      clearTimeout(hideTimer.current);
      clearTimeout(showTimer.current);
      showTimer.current = window.setTimeout(async () => {
        const notes = await loadVault().catch(() => null);
        const note = notes && findNote(notes, a.href);
        if (!note || !a.isConnected) return;
        const rect = a.getBoundingClientRect();
        const above = rect.bottom + 220 > window.innerHeight;
        setPreview({
          note,
          above,
          top: above ? rect.top - 8 : rect.bottom + 8,
          left: Math.min(Math.max(12, rect.left), window.innerWidth - WIDTH - 12),
        });
      }, 350);
    };

    const onOut = (e: MouseEvent) => {
      const leaving = linkFrom(e.target) || (e.target as Element).closest?.('.vault-preview');
      if (!leaving) return;
      clearTimeout(showTimer.current);
      hideTimer.current = window.setTimeout(() => setPreview(null), 180);
    };

    const close = () => setPreview(null);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    window.addEventListener('scroll', close, { passive: true });
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('scroll', close);
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  if (!preview) return null;
  const { note, top, left, above } = preview;
  return (
    <div
      role="tooltip"
      className="vault-preview glass glass-strong fixed z-[350] p-4"
      style={{ top, left, width: WIDTH, transform: above ? 'translateY(-100%)' : undefined, ['--glass-radius' as string]: '1rem' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{note.meta}</p>
      <p className="mt-1 font-semibold leading-snug text-foreground">{note.title}</p>
      <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{note.excerpt}</p>
    </div>
  );
}
