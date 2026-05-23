'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type ThemeOption = {
  id: string;
  label: string;
  primary: string; // Tailwind color value for preview dot
  bg: string;      // Tailwind color value for preview bg
};

const themes: ThemeOption[] = [
  { id: 'matrix',  label: 'Matrix',  primary: 'bg-emerald-500', bg: 'bg-zinc-950' },
  { id: 'dracula', label: 'Dracula', primary: 'bg-[#ff79c6]',   bg: 'bg-[#282a36]' },
  { id: 'fallout', label: 'Fallout', primary: 'bg-[#ffb000]',   bg: 'bg-[#0d0805]' },
  { id: 'nord',    label: 'Nord',    primary: 'bg-[#88c0d0]',   bg: 'bg-[#2e3440]' },
  { id: 'monokai', label: 'Monokai', primary: 'bg-[#a6e22e]',   bg: 'bg-[#272822]' },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('matrix');
  const [open, setOpen] = useState(false);

  // Initialize theme from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem('portfolio-theme') || 'matrix';
    setCurrentTheme(saved);
    if (saved !== 'matrix') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const changeTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('portfolio-theme', themeId);
    
    if (themeId === 'matrix') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-sm hover:bg-background/80 text-muted-foreground hover:text-primary transition-all duration-200"
        aria-label="Switch Theme"
      >
        <Palette className="h-4.5 w-4.5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Click outside overlay */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setOpen(false)} 
            />
            
            {/* Popover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute right-0 bottom-full mb-3 md:bottom-auto md:top-full md:mt-3 z-50 w-44 rounded-sm border border-border/80 bg-card p-1.5 shadow-xl shadow-black/20 backdrop-blur-xl"
            >
              <div className="px-2 py-1.5 border-b border-border/60 mb-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
                  {'// select_theme'}
                </span>
              </div>
              <div className="space-y-0.5">
                {themes.map((theme) => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => changeTheme(theme.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded-sm font-mono text-xs transition-all duration-150',
                        isSelected 
                          ? 'text-primary bg-primary/10' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {/* Theme color previews */}
                        <div className={cn('w-3.5 h-3.5 rounded-full border border-border/60 flex items-center justify-center overflow-hidden shrink-0', theme.bg)}>
                          <div className={cn('w-1.5 h-1.5 rounded-full', theme.primary)} />
                        </div>
                        <span>{theme.label}</span>
                      </div>
                      {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
