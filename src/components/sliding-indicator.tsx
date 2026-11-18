'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * A highlight that slides to the active item in a row (the mobile tab bar's pill, the blog's topic
 * underline). The row is measured and one indicator is moved with a CSS transition, so pages carry
 * no animation library for it (framer-motion's shared layout animations needed its heaviest
 * feature set on every page). Mark the active item with data-slide-active; `active` re-measures
 * when it changes. Doesn't move with reduced motion (globals.css .slide-indicator).
 */
export function useSlidingIndicator<T extends HTMLElement>(active: string | undefined) {
  const row = useRef<T>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = row.current;
    if (!el) return;
    const place = () => {
      const item = el.querySelector<HTMLElement>('[data-slide-active]');
      setBox(item ? { x: item.offsetLeft, y: item.offsetTop, w: item.offsetWidth, h: item.offsetHeight } : null);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(el);
    // Slide only after the first placement, so it doesn't fly in from the edge on load.
    const frame = requestAnimationFrame(() => setReady(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [active]);

  return { row, box, ready };
}

/** The indicator itself, absolutely placed in the measured row; `fit` covers the item or underlines it. */
export function SlidingIndicator({
  box,
  ready,
  fit,
  className,
}: {
  box: { x: number; y: number; w: number; h: number } | null;
  ready: boolean;
  fit: 'cover' | 'underline';
  className?: string;
}) {
  if (!box) return null;
  const style: CSSProperties =
    fit === 'cover'
      ? { width: box.w, height: box.h, transform: `translate(${box.x}px, ${box.y}px)` }
      : { width: box.w, transform: `translateX(${box.x}px)` };
  return <span aria-hidden className={cn('slide-indicator pointer-events-none absolute left-0', fit === 'cover' ? 'top-0' : '-bottom-px', ready && 'slide-indicator-ready', className)} style={style} />;
}
