'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useDesignStyle } from '@/lib/design-style';

/**
 * The moving parts of the Blueprint look:
 * - card borders draw themselves in as each card scrolls into view (any device);
 * - on a mouse: a measuring crosshair with live coordinates that snaps to the grid,
 *   the grid lit up around the pointer, and dimension lines on the card under it.
 *
 * Everything is transforms on a few fixed layers, written once per animation frame.
 * Nothing runs in the other looks, and only the static drawing shows with reduced motion.
 */

const GRID = 24;
const SPOT = 440;
/** Cards smaller than this are buttons and pills: no dimension lines for those. */
const MIN_DIM = 120;

export function BlueprintFx() {
  const [look] = useDesignStyle();
  const pathname = usePathname();
  const fx = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);
  const active = look === 'blueprint';

  // Borders that draw in: mark every card that hasn't been seen, unmark as it comes into view.
  useEffect(() => {
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          seen.add(entry.target);
          observer.unobserve(entry.target);
          // Let the "undrawn" state paint first so the transition runs.
          requestAnimationFrame(() => requestAnimationFrame(() => entry.target.removeAttribute('data-bp-pending')));
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    const scan = () => {
      document.querySelectorAll('.glass').forEach((el) => {
        if (seen.has(el) || el.hasAttribute('data-bp-pending')) return;
        el.setAttribute('data-bp-pending', '');
        observer.observe(el);
      });
    };
    scan();
    // Cards that arrive later (lists that load, menus that open).
    const late = window.setTimeout(scan, 1200);
    return () => {
      window.clearTimeout(late);
      observer.disconnect();
      document.querySelectorAll('[data-bp-pending]').forEach((el) => el.removeAttribute('data-bp-pending'));
    };
  }, [active, pathname]);

  // The crosshair, the lit grid and the dimension lines: a fine pointer only.
  useEffect(() => {
    const root = fx.current;
    const glow = spot.current;
    if (!active || !root || !glow) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const quiet = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || quiet.matches) return;

    const [lineX, lineY, snap, tagX, tagY, dimW, dimH] = Array.from(root.children) as HTMLElement[];
    const tagW = dimW.firstElementChild as HTMLElement;
    const tagH = dimH.firstElementChild as HTMLElement;
    let x = -1;
    let y = -1;
    let card: HTMLElement | null = null;
    let retarget = false;
    let frame = 0;

    /** The card under the pointer, if it is one worth measuring. */
    const cardAt = (target: Element | null) => {
      const found = (target?.closest('.glass:not(.glass-pill)') as HTMLElement | null) ?? null;
      return found?.closest('.vt-nav, .vt-tabbar, .theme-menu') ? null : found;
    };

    const draw = () => {
      frame = 0;
      if (x < 0) return;
      // After a scroll a different card can be under a pointer that hasn't moved.
      if (retarget) {
        retarget = false;
        card = cardAt(document.elementFromPoint(x, y));
      }
      lineX.style.transform = `translate3d(0, ${y}px, 0)`;
      lineY.style.transform = `translate3d(${x}px, 0, 0)`;
      const sx = Math.round(x / GRID) * GRID;
      const sy = Math.round(y / GRID) * GRID;
      snap.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
      tagX.textContent = `X ${String(Math.round(x + window.scrollX)).padStart(4, '0')}`;
      tagY.textContent = `Y ${String(Math.round(y + window.scrollY)).padStart(4, '0')}`;
      tagX.style.transform = `translate3d(${x + 8}px, 8px, 0)`;
      tagY.style.transform = `translate3d(8px, ${y + 8}px, 0)`;
      // The lit patch is a small layer that moves; its grid is shifted to line up with the paper's.
      const gx = x - SPOT / 2;
      const gy = y - SPOT / 2;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      glow.style.backgroundPosition = Array(4).fill(`${-gx}px ${-gy}px`).concat('0 0').join(', ');

      const rect = card?.getBoundingClientRect();
      const show = !!rect && rect.width >= MIN_DIM && rect.height >= 48 && rect.top > 28 && rect.left > 28;
      if (show && rect) {
        dimW.style.transform = `translate3d(${rect.left}px, ${rect.top - 16}px, 0)`;
        dimW.style.width = `${rect.width}px`;
        dimH.style.transform = `translate3d(${rect.left - 16}px, ${rect.top}px, 0)`;
        dimH.style.height = `${rect.height}px`;
        tagW.textContent = `${Math.round(rect.width)}`;
        tagH.textContent = `${Math.round(rect.height)}`;
      }
      dimW.toggleAttribute('data-on', show);
      dimH.toggleAttribute('data-on', show);
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      const target = e.target instanceof Element ? e.target : null;
      // Reading a post or typing: get out of the way.
      const reading = !!target?.closest('.article-body, input, textarea, select, [contenteditable="true"]');
      root.toggleAttribute('data-on', !reading);
      glow.toggleAttribute('data-on', true);
      card = cardAt(target);
      queue();
    };
    const onScroll = () => {
      retarget = true;
      queue();
    };
    const hide = () => {
      root.removeAttribute('data-on');
      glow.removeAttribute('data-on');
      card = null;
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseout', onLeave);
    window.addEventListener('blur', hide);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onLeave);
      window.removeEventListener('blur', hide);
      hide();
    };
  }, [active]);

  if (!active) return null;
  return (
    <>
      <div ref={spot} aria-hidden className="bp-spot" />
      <div ref={fx} aria-hidden className="bp-fx">
        <div className="bp-x" />
        <div className="bp-y" />
        <div className="bp-snap" />
        <div className="bp-tag" />
        <div className="bp-tag" />
        <div className="bp-dim bp-dim-w">
          <span className="bp-tag" />
        </div>
        <div className="bp-dim bp-dim-h">
          <span className="bp-tag" />
        </div>
      </div>
    </>
  );
}
