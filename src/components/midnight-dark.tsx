'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useDesignStyle } from '@/lib/design-style';

/** Midnight is dark-only and Terminal light-only: keep the theme in step with the active look. */
export function MidnightDark() {
  const [look] = useDesignStyle();
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => {
    if (!resolvedTheme) return;
    if (look === 'midnight' && resolvedTheme !== 'dark') setTheme('dark');
    if (look === 'terminal' && resolvedTheme !== 'light') setTheme('light');
  }, [look, resolvedTheme, setTheme]);
  return null;
}
