'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The site's look: midnight (dark, the default), soft (neumorphism) or glass
 * (the original Liquid Glass). The choice is stored per browser and applied to
 * <html> as data-style="soft" | "glass" before first paint (see the inline
 * script in app/layout). No attribute means midnight, so the default needs no
 * JavaScript.
 */

export type DesignStyle = 'midnight' | 'soft' | 'glass';

export const STYLE_STORAGE_KEY = 'portfolio-style';

const read = (): DesignStyle => {
  if (typeof document === 'undefined') return 'midnight';
  const style = document.documentElement.dataset.style;
  return style === 'glass' || style === 'soft' ? style : 'midnight';
};

export function applyDesignStyle(style: DesignStyle) {
  if (style === 'midnight') delete document.documentElement.dataset.style;
  else document.documentElement.dataset.style = style;
  try {
    localStorage.setItem(STYLE_STORAGE_KEY, style);
  } catch {}
}

/** The current look, kept in sync when it changes anywhere on the page. */
export function useDesignStyle(): [DesignStyle, (style: DesignStyle) => void] {
  const [style, setStyle] = useState<DesignStyle>('midnight');

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
