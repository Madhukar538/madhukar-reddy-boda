'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Palette } from 'lucide-react';
import { useDesignStyle, type DesignStyle } from '@/lib/design-style';
import { cn } from '@/lib/utils';

/**
 * Every theme a visitor can pick. Add a theme here (and its CSS under
 * html[data-style='<id>'] in globals.css) and it shows up in the picker.
 */
export const THEMES: { id: DesignStyle; label: string; hint: string; swatch: string }[] = [
  { id: 'terminal', label: 'Terminal', hint: 'Light · default', swatch: 'linear-gradient(135deg, #F7F7F4 50%, #C6F432 50%)' },
  { id: 'midnight', label: 'Midnight', hint: 'Warm dark', swatch: 'linear-gradient(135deg, #110F0D 50%, #D94A54 50%)' },
  { id: 'glass', label: 'Glass', hint: 'Liquid glass', swatch: 'linear-gradient(135deg, #7DD3FC, #F0ABFC, #FDE68A)' },
];

const MENU_W = 208;
const MENU_H = 210;
const GAP = 8;

/**
 * The theme picker: a palette button that opens the list of themes. The choice is remembered
 * per browser. The menu is rendered on <body>, placed beside the button, because the navbar's
 * capsule clips everything inside it (its slide animation uses clip-path).
 */
export function LookToggle({ className }: { className?: string }) {
  const [look, setLook] = useDesignStyle();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const current = THEMES.find((t) => t.id === look) ?? THEMES[0];

  // Below the button when there is room, otherwise above; right edges aligned, kept on screen.
  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const place = () => {
      const r = button.current!.getBoundingClientRect();
      const below = r.bottom + GAP + MENU_H <= window.innerHeight;
      const left = Math.min(Math.max(GAP, r.right - MENU_W), window.innerWidth - MENU_W - GAP);
      setPos({ top: below ? r.bottom + GAP : Math.max(GAP, r.top - GAP - MENU_H), left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, { passive: true });
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') {
          setOpen(false);
          button.current?.focus();
        }
        return;
      }
      const target = e.target as Node;
      if (!menu.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Theme: ${current.label}. Change theme`}
        aria-expanded={open}
        aria-haspopup="true"
        title="Change theme"
        className={cn(
          'look-toggle flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground',
          className
        )}
      >
        <Palette className="h-[1.05rem] w-[1.05rem]" />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menu}
            role="radiogroup"
            aria-label="Theme"
            className="theme-menu glass glass-strong fixed z-[400] p-1.5"
            style={{ top: pos.top, left: pos.left, width: MENU_W }}
          >
            <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold text-muted-foreground">Theme</p>
            {THEMES.map((theme) => {
              const selected = theme.id === look;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setLook(theme.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    selected ? 'bg-foreground/10 text-foreground' : 'text-foreground/85 hover:bg-foreground/5'
                  )}
                >
                  <span aria-hidden className="h-5 w-5 shrink-0 rounded-md ring-1 ring-foreground/20" style={{ background: theme.swatch }} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-tight">{theme.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{theme.hint}</span>
                  </span>
                  {selected && <Check aria-hidden className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
