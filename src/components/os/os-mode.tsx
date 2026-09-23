'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OsData } from './apps';

/**
 * Desktop ("OS") mode is opt-in: off by default, switched on with a toggle,
 * remembered per visitor. While it's off, none of its code or data loads.
 */

const STORAGE_KEY = 'portfolio-os-mode';

type OsMode = { enabled: boolean; setEnabled: (on: boolean) => void };

const OsModeContext = createContext<OsMode>({ enabled: false, setEnabled: () => {} });

export const useOsMode = () => useContext(OsModeContext);

// Loaded on demand only.
const PortfolioOS = dynamic(() => import('./desktop').then((m) => m.PortfolioOS), { ssr: false });

export function OsModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [data, setData] = useState<OsData | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'on') setEnabledState(true);
    } catch {}
  }, []);

  const setEnabled = useCallback((on: boolean) => {
    setEnabledState(on);
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch {}
  }, []);

  // Lets the live fluid background pause while the desktop covers the page.
  useEffect(() => {
    const root = document.documentElement;
    if (enabled) root.dataset.osMode = 'on';
    else delete root.dataset.osMode;
  }, [enabled]);

  useEffect(() => {
    if (!enabled || data) return;
    let cancelled = false;
    fetch('/os-data.json')
      .then((r) => r.json())
      .then((d: OsData) => !cancelled && setData(d))
      .catch(() => !cancelled && setEnabled(false));
    return () => {
      cancelled = true;
    };
  }, [enabled, data, setEnabled]);

  return (
    <OsModeContext.Provider value={{ enabled, setEnabled }}>
      {children}
      {enabled && data && <PortfolioOS data={data} onExit={() => setEnabled(false)} />}
    </OsModeContext.Provider>
  );
}

/** Icon button (nav) or text link (footer, hero) that switches desktop mode on or off. */
export function OsModeToggle({ variant = 'icon', className }: { variant?: 'icon' | 'link'; className?: string }) {
  const { enabled, setEnabled } = useOsMode();
  const label = enabled ? 'Exit desktop mode' : 'Desktop mode';

  if (variant === 'link') {
    return (
      <button type="button" onClick={() => setEnabled(!enabled)} className={className}>
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 active:scale-90',
        enabled ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-foreground/10 hover:text-foreground',
        className
      )}
    >
      <Monitor className="h-[1.05rem] w-[1.05rem]" />
    </button>
  );
}
