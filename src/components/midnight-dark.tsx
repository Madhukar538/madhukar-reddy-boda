'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useDesignStyle } from '@/lib/design-style';

/** Midnight is dark-only: keep the theme on dark while it is the active look. */
export function MidnightDark() {
  const [look] = useDesignStyle();
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => {
    if (look === 'midnight' && resolvedTheme && resolvedTheme !== 'dark') setTheme('dark');
  }, [look, resolvedTheme, setTheme]);
  return null;
}
