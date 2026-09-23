'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { List, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TocItem } from '@/lib/blog';

const WORDS_PER_MINUTE = 220;

/**
 * Everything interactive around a post: reading progress, minutes left,
 * the table of contents (sticky on desktop, a sheet on mobile) with the
 * current section highlighted, and copy buttons on code blocks.
 */
export function ReaderChrome({ toc, words }: { toc: TocItem[]; words: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [minutesLeft, setMinutesLeft] = useState(Math.max(1, Math.round(words / WORDS_PER_MINUTE)));
  const [active, setActive] = useState<string | null>(toc[0]?.id ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Progress through the article body, and the section being read: the last
  // heading above 30% of the viewport. Computed on scroll so long jumps
  // (anchor links, End key) land on the right section.
  useEffect(() => {
    const body = document.querySelector<HTMLElement>('.article-body');
    if (!body) return;
    const headings = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      const passed = headings.filter((h) => h.getBoundingClientRect().top < line);
      setActive((passed.at(-1) ?? headings[0])?.id ?? null);

      // Share of the body that has scrolled into view: done when its end is on screen.
      const rect = body.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / Math.max(rect.height, 1)));
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      setMinutesLeft(Math.max(0, Math.ceil(((1 - progress) * words) / WORDS_PER_MINUTE)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [words, toc]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  // Copy buttons on code blocks.
  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLElement>('.article-body .code-block');
    const cleanups: (() => void)[] = [];
    blocks.forEach((block) => {
      if (block.querySelector('.copy-btn')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-btn';
      button.textContent = 'Copy';
      const onClick = () => {
        navigator.clipboard?.writeText(block.querySelector('code')?.textContent ?? '');
        button.textContent = 'Copied';
        setTimeout(() => (button.textContent = 'Copy'), 1500);
      };
      button.addEventListener('click', onClick);
      block.querySelector('figcaption')?.appendChild(button);
      cleanups.push(() => {
        button.removeEventListener('click', onClick);
        button.remove();
      });
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  const timeLeft = minutesLeft === 0 ? 'Finished' : `${minutesLeft} min left`;

  const list = (onPick?: () => void) => (
    <ol className="space-y-0.5 text-sm">
      {toc.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={onPick}
            aria-current={active === item.id ? 'location' : undefined}
            className={cn(
              'block rounded-lg border-l-2 py-1.5 pr-2 leading-snug transition-colors',
              item.level === 3 ? 'pl-6' : 'pl-3',
              active === item.id
                ? 'border-primary bg-primary/10 font-semibold text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <div
        ref={barRef}
        className="fixed top-0 left-0 right-0 z-[300] h-[3px] origin-left bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
        style={{ transform: 'scaleX(0)' }}
      />

      {/* Desktop: sticky contents */}
      {toc.length > 1 && (
        <nav aria-label="Contents" className="hidden lg:block glass p-4 max-h-[calc(100dvh-9rem)] overflow-y-auto">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contents</p>
            <p className="text-xs text-muted-foreground">{timeLeft}</p>
          </div>
          {list()}
        </nav>
      )}

      {/* Mobile: floating button + sheet */}
      {toc.length > 1 && (
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="glass glass-strong glass-pill fixed bottom-24 left-4 z-[90] flex items-center gap-2 px-4 py-2 text-sm font-medium shadow-lg"
          >
            <List className="h-4 w-4 text-primary" />
            Contents
            <span className="text-muted-foreground">· {timeLeft}</span>
          </button>
          {/* Portalled: the page's <main> is its own stacking context, under the tab bar. */}
          {sheetOpen && createPortal(
            <div className="fixed inset-0 z-[400] flex items-end bg-black/30 backdrop-blur-sm" onClick={() => setSheetOpen(false)}>
              <nav
                aria-label="Contents"
                className="glass glass-strong m-3 w-full max-h-[70dvh] overflow-y-auto p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-sm font-semibold">Contents · <span className="font-normal text-muted-foreground">{timeLeft}</span></p>
                  <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close contents" className="rounded-full p-1 hover:bg-foreground/10">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {list(() => setSheetOpen(false))}
              </nav>
            </div>,
            document.body
          )}
        </div>
      )}
    </>
  );
}
