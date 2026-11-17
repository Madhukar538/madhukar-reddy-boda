'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, Palette } from 'lucide-react';
import { STYLE_STORAGE_KEY, applyDesignStyle, useDesignStyle, type DesignStyle } from '@/lib/design-style';
import { cn } from '@/lib/utils';

/**
 * How each theme looks in the picker. Which ones are offered, and the default, are set in the
 * admin (Themes) and come from the API (lib/content getThemeSettings). A new theme needs its CSS
 * under html[data-style='<id>'] in globals.css, an entry here, and one in the API's ThemeBAL.Registry.
 */
export const THEMES: { id: DesignStyle; label: string; hint: string; swatch: string }[] = [
  { id: 'terminal', label: 'Terminal', hint: 'Light', swatch: 'linear-gradient(135deg, #F7F7F4 50%, #C6F432 50%)' },
  { id: 'midnight', label: 'Midnight', hint: 'Warm dark', swatch: 'linear-gradient(135deg, #110F0D 50%, #D94A54 50%)' },
  { id: 'blueprint', label: 'Blueprint', hint: 'Interactive', swatch: 'linear-gradient(135deg, #0B2545 50%, #5CE1E6 50%)' },
  { id: 'editorial', label: 'Editorial', hint: 'Kinetic type', swatch: 'linear-gradient(135deg, #F1EFEA 50%, #FF4D00 50%)' },
  { id: 'glass', label: 'Glass', hint: 'Liquid glass', swatch: 'linear-gradient(135deg, #7DD3FC, #F0ABFC, #FDE68A)' },
  { id: 'arctic', label: 'Arctic', hint: 'Cool light', swatch: 'linear-gradient(135deg, #EEF2F7 50%, #165FC8 50%)' },
  { id: 'synthwave', label: 'Synthwave', hint: 'Neon dark', swatch: 'linear-gradient(135deg, #11052A 50%, #FF3DA5 50%)' },
  { id: 'dune', label: 'Dune', hint: 'Warm serif', swatch: 'linear-gradient(135deg, #F3EADB 50%, #A63F25 50%)' },
  { id: 'gazette', label: 'Gazette', hint: 'Newspaper', swatch: 'linear-gradient(135deg, #F4F1EA 50%, #151515 50%)' },
  { id: 'receipt', label: 'Receipt', hint: 'Till slip', swatch: 'linear-gradient(135deg, #FFFEFA 50%, #C62E2E 50%)' },
  { id: 'observatory', label: 'Observatory', hint: 'Star atlas', swatch: 'linear-gradient(135deg, #070B18 50%, #F5C46B 50%)' },
  { id: 'bazaar', label: 'Bazaar', hint: 'General store', swatch: 'linear-gradient(135deg, #F2B705 50%, #C8102E 50%)' },
];

type ThemeOptions = { defaultTheme: DesignStyle; enabled: DesignStyle[] };
const ThemeOptionsContext = createContext<ThemeOptions>({ defaultTheme: 'terminal', enabled: THEMES.map((t) => t.id) });

/** Hands the admin's theme settings (read on the server) to every picker on the page. */
export function ThemeOptionsProvider({ value, children }: { value: ThemeOptions; children: ReactNode }) {
  // The inline script in the layout applies the visitor's saved look before first paint. A page Next
  // renders as an error shell (the 404) is built in the browser, where inline scripts don't run, so
  // the saved look is applied here instead; on every other page it is already in place and this does nothing.
  useEffect(() => {
    try {
      // A ?look= preview (Admin > Themes) keeps the look it asked for.
      if (new URLSearchParams(window.location.search).has('look')) return;
      const saved = localStorage.getItem(STYLE_STORAGE_KEY) as DesignStyle | null;
      if (!saved || !value.enabled.includes(saved)) return;
      const current = document.documentElement.dataset.style ?? 'midnight';
      if (current !== saved) applyDesignStyle(saved);
    } catch {}
  }, [value.enabled]);
  return <ThemeOptionsContext.Provider value={value}>{children}</ThemeOptionsContext.Provider>;
}

const MENU_W = 208;
/** The menu's height: its label plus one row per theme (kept in step with the rows' padding). */
const menuHeight = (count: number) => 38 + count * 55;
const GAP = 8;

/**
 * The theme picker: a palette button that opens the list of themes. The choice is remembered
 * per browser. The menu is rendered on <body>, placed beside the button, because the navbar's
 * capsule clips everything inside it (its slide animation uses clip-path).
 */
export function LookToggle({ className }: { className?: string }) {
  const [look, setLook] = useDesignStyle();
  const { defaultTheme, enabled } = useContext(ThemeOptionsContext);
  const themes = THEMES.filter((t) => enabled.includes(t.id));
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const current = themes.find((t) => t.id === look) ?? themes[0] ?? THEMES[0];

  // Below the button when there is room, otherwise above; right edges aligned, kept on screen.
  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const MENU_H = Math.min(menuHeight(themes.length), window.innerHeight - 2 * GAP);
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
  }, [open, themes.length]);

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

  // One theme on offer: nothing to pick.
  if (themes.length < 2) return null;

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
            style={{ top: pos.top, left: pos.left, width: MENU_W, maxHeight: `calc(100vh - ${2 * GAP}px)`, overflowY: 'auto' }}
          >
            <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold text-muted-foreground">Theme</p>
            {themes.map((theme) => {
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
                    <span className="block text-[11px] text-muted-foreground">
                      {theme.hint}
                      {theme.id === defaultTheme && ' · default'}
                    </span>
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
