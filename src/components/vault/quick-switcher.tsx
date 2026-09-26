'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// The dialog (and the note index it reads) loads on first open.
const QuickSwitcherDialog = dynamic(() => import('./quick-switcher-dialog'), { ssr: false });

/** Obsidian's quick switcher: ⌘K / Ctrl+K (or the nav's search button) jumps to any note. */
export function QuickSwitcher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const show = () => {
      setLoaded(true);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setLoaded(true);
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('vault:open', show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('vault:open', show);
    };
  }, []);

  return loaded ? <QuickSwitcherDialog open={open} onClose={() => setOpen(false)} /> : null;
}
