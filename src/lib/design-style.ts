'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The site's look: terminal (light, the default), midnight (warm dark, the
 * backup), blueprint (interactive architect's drawing, dark), editorial (kinetic
 * type on paper, light) or glass (the original Liquid Glass).
 * The server renders <html data-style="terminal">; a visitor who picked
 * Midnight has it stored, and the inline script in app/layout removes the
 * attribute before first paint. No attribute means midnight.
 */

export type DesignStyle = 'terminal' | 'midnight' | 'blueprint' | 'editorial' | 'glass';

export const STYLE_STORAGE_KEY = 'portfolio-style';

const read = (): DesignStyle => {
  if (typeof document === 'undefined') return 'terminal';
  const style = document.documentElement.dataset.style;
  return style === 'glass' || style === 'terminal' || style === 'blueprint' || style === 'editorial' ? style : 'midnight';
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
  const [style, setStyle] = useState<DesignStyle>('terminal');

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
