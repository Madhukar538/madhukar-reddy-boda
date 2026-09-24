'use client';

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m, AnimatePresence } from 'framer-motion';

type AccentOption = {
  id: string;
  label: string;
  swatch: string; // CSS color for the preview swatch
};

// Apple system accent colors
const accents: AccentOption[] = [
  { id: 'blue',     label: 'Blue',     swatch: '#0A84FF' },
  { id: 'purple',   label: 'Purple',   swatch: '#BF5AF2' },
  { id: 'pink',     label: 'Pink',     swatch: '#FF375F' },
  { id: 'orange',   label: 'Orange',   swatch: '#FF9F0A' },
  { id: 'green',    label: 'Green',    swatch: '#30D158' },
  { id: 'graphite', label: 'Graphite', swatch: '#8E8E93' },
];

const STORAGE_KEY = 'portfolio-accent';

function applyAccent(id: string) {
  if (id === 'blue') {
    document.documentElement.removeAttribute('data-accent');
  } else {
    document.documentElement.setAttribute('data-accent', id);
  }
}

export function ThemeSwitcher() {
  const [current, setCurrent] = useState('blue');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let saved = 'blue';
    try {
      saved = localStorage.getItem(STORAGE_KEY) || 'blue';
    } catch {}
    if (!accents.some((a) => a.id === saved)) saved = 'blue';
    setCurrent(saved);
    applyAccent(saved);
  }, []);

  const changeAccent = (id: string) => {
    setCurrent(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
    applyAccent(id);
    setOpen(false);
  };

  const active = accents.find((a) => a.id === current) ?? accents[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:bg-foreground/10 active:scale-90"
        aria-label="Choose accent color"
        aria-expanded={open}
      >
        <span
          className="h-4 w-4 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_0_2px_hsl(var(--background)/0.6)]"
          style={{
            background: `conic-gradient(from 180deg, ${accents.map((a) => a.swatch).join(', ')}, ${accents[0].swatch})`,
          }}
        />
        <span className="sr-only">Current accent: {active.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <m.div
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="glass glass-strong absolute right-0 bottom-full mb-3 lg:bottom-auto lg:top-full lg:mt-3 z-50 w-48 p-2 origin-bottom-right lg:origin-top-right"
              style={{ ['--glass-radius' as string]: '1.25rem' }}
            >
              <p className="px-2.5 pt-1 pb-2 text-[11px] font-semibold text-muted-foreground">
                Accent Color
              </p>
              <div className="space-y-0.5">
                {accents.map((accent) => {
                  const isSelected = current === accent.id;
                  return (
                    <button
                      key={accent.id}
                      type="button"
                      onClick={() => changeAccent(accent.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm transition-colors duration-150',
                        isSelected ? 'bg-foreground/10 text-foreground' : 'text-foreground/80 hover:bg-foreground/5'
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className="h-4 w-4 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                          style={{ background: accent.swatch }}
                        />
                        {accent.label}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
