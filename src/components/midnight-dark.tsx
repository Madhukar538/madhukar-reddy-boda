'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useDesignStyle } from '@/lib/design-style';

/** Midnight, Blueprint and Synthwave are dark-only; Terminal, Editorial, Arctic and Dune light-only: keep the theme in step with the active look. */
export function MidnightDark() {
  const [look] = useDesignStyle();
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => {
    if (!resolvedTheme) return;
    if ((look === 'midnight' || look === 'blueprint' || look === 'synthwave') && resolvedTheme !== 'dark') setTheme('dark');
    if ((look === 'terminal' || look === 'editorial' || look === 'arctic' || look === 'dune') && resolvedTheme !== 'light') setTheme('light');
  }, [look, resolvedTheme, setTheme]);
  return null;
}
