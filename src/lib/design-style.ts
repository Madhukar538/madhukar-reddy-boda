'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The site's look: soft (neumorphism, the default) or glass (the original
 * Liquid Glass). The choice is stored per browser and applied to <html> as
 * data-style="glass" before first paint (see the inline script in app/layout).
 * No attribute means soft, so the default needs no JavaScript.
 */

export type DesignStyle = 'soft' | 'glass';

export const STYLE_STORAGE_KEY = 'portfolio-style';

const read = (): DesignStyle =>
  typeof document !== 'undefined' && document.documentElement.dataset.style === 'glass' ? 'glass' : 'soft';

export function applyDesignStyle(style: DesignStyle) {
  if (style === 'glass') document.documentElement.dataset.style = 'glass';
  else delete document.documentElement.dataset.style;
  try {
    localStorage.setItem(STYLE_STORAGE_KEY, style);
  } catch {}
}

/** The current look, kept in sync when it changes anywhere on the page. */
export function useDesignStyle(): [DesignStyle, (style: DesignStyle) => void] {
  const [style, setStyle] = useState<DesignStyle>('soft');

  useEffect(() => {
    setStyle(read());
    const observer = new MutationObserver(() => setStyle(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-style'] });
    return () => observer.disconnect();
  }, []);

  const change = useCallback((next: DesignStyle) => {
    applyDesignStyle(next);
    setStyle(next);
  }, []);

  return [style, change];
}
