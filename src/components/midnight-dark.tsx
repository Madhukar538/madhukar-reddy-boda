'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useDesignStyle } from '@/lib/design-style';

/** Midnight, Blueprint, Synthwave and Observatory are dark-only; the other named looks (not Glass) light-only: keep the theme in step with the active look. */
export function MidnightDark() {
  const [look] = useDesignStyle();
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => {
    if (!resolvedTheme) return;
    if ((look === 'midnight' || look === 'blueprint' || look === 'synthwave' || look === 'observatory') && resolvedTheme !== 'dark') setTheme('dark');
    if ((look === 'terminal' || look === 'editorial' || look === 'arctic' || look === 'dune' || look === 'gazette' || look === 'receipt' || look === 'bazaar') && resolvedTheme !== 'light') setTheme('light');
  }, [look, resolvedTheme, setTheme]);
  return null;
}
