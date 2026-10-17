'use client';

import { useEffect } from 'react';
import { FluidBackground } from './fluid-background';
import { useDesignStyle } from '@/lib/design-style';

/**
 * Vivid, slowly drifting backdrop that the glass surfaces refract,
 * plus a single delegated pointer listener that feeds the specular
 * highlight position (--mx / --my) to whichever .glass-interactive
 * element is under the cursor.
 */
export function LiquidWallpaper() {
  // The soft look has a solid surface: the CSS hides the blobs and nothing runs.
  // Midnight keeps the CSS blobs and the pointer highlight; only Glass adds the
  // WebGL fluid.
  const [style] = useDesignStyle();
  const isGlass = style === 'glass';
  const hasGlassMaterial = style !== 'soft';

  useEffect(() => {
    if (!hasGlassMaterial || !window.matchMedia('(hover: hover)').matches) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest<HTMLElement>('.glass-interactive');
      if (!target) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        target.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', onMove);
    };
  }, [hasGlassMaterial]);

  return (
    <div className="liquid-wallpaper" aria-hidden="true">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <div className="blob blob-c" />
      <div className="blob blob-d" />
      {isGlass && <FluidBackground />}
    </div>
  );
}
