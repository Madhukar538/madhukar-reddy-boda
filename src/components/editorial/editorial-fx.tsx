'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDesignStyle } from '@/lib/design-style';

/**
 * The moving parts of the Editorial look:
 * - the name's letters widen and thicken toward the pointer (a variable font's width and weight);
 * - the name's lines slide apart as you scroll, and the ticker speeds up and turns with you;
 * - headings below the fold rise into place as they arrive;
 * - "Selected work" pins and scrolls sideways (desktop; phones swipe it instead);
 * - a ring follows the pointer and grows over anything you can open.
 *
 * Everything is written once per animation frame. Nothing runs in the other looks, and with
 * reduced motion the page stays still (the letters, the ticker and the gallery included).
 */

const near = 260; // px: how far the pointer reaches into the name

export function EditorialFx() {
  const [look] = useDesignStyle();
  const pathname = usePathname();
  const active = look === 'editorial';
  // Editorial's blocks can arrive after this runs (they load on demand, components/looks/editorial-view):
  // each tells us when it has mounted, and the effects are set up again over the whole page.
  const [mounts, setMounts] = useState(0);
  useEffect(() => {
    const bump = () => setMounts((n) => n + 1);
    window.addEventListener('editorial:mounted', bump);
    return () => window.removeEventListener('editorial:mounted', bump);
  }, []);

  useEffect(() => {
    if (!active) return;
    const quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const root = document.documentElement;
    if (quiet) return;
    root.setAttribute('data-ed-js', '');

    const cleanups: (() => void)[] = [() => root.removeAttribute('data-ed-js')];
    let frame = 0;
    let px = -1e4;
    let py = -1e4;
    let lastY = window.scrollY;
    let velocity = 0;

    // ---- Reveal: headings and marked blocks below the fold rise in as they arrive.
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-in', '');
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    const scan = () => {
      document.querySelectorAll<HTMLElement>('main h2, .ed-reveal').forEach((el) => {
        if (el.hasAttribute('data-ed-seen')) return;
        el.setAttribute('data-ed-seen', '');
        if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it be
        el.setAttribute('data-ed-wait', '');
        reveal.observe(el);
      });
    };
    scan();
    const late = window.setTimeout(scan, 1200);
    cleanups.push(() => {
      window.clearTimeout(late);
      reveal.disconnect();
      document.querySelectorAll('[data-ed-seen]').forEach((el) => {
        el.removeAttribute('data-ed-seen');
        el.removeAttribute('data-ed-wait');
        el.removeAttribute('data-in');
      });
    });

    // The home name, or the 404's figures: letters in either widen toward the pointer.
    const hero = document.querySelector<HTMLElement>('.ed-hero, .ed-404');
    const story = document.querySelector<HTMLElement>('.ed-chapters');
    const storyFill = story?.querySelector<HTMLElement>('.ed-chapters-fill');
    // The name's lines slide apart as you scroll, at these rates (px per px scrolled).
    const lines = Array.from(document.querySelectorAll<HTMLElement>('.ed-line'));
    const LINE_RATES = [-0.35, 0.3, -0.2];
    const chars = Array.from(document.querySelectorAll<HTMLElement>('.ed-char'));
    const ticker = document.querySelector<HTMLElement>('.ed-ticker-track');
    const tickerAnimation = ticker?.getAnimations()[0];

    // ---- The pinned sideways gallery (wide screens with a mouse or trackpad).
    const gallery = document.querySelector<HTMLElement>('.ed-gallery');
    const track = gallery?.querySelector<HTMLElement>('.ed-track');
    let travel = 0;
    const measure = () => {
      if (!gallery || !track) return;
      const pin = fine && window.innerWidth >= 1024;
      gallery.toggleAttribute('data-pinned', pin);
      travel = pin ? Math.max(0, track.scrollWidth - track.clientWidth) : 0;
      gallery.style.height = pin ? `${window.innerHeight + travel}px` : '';
    };
    measure();
    cleanups.push(() => {
      if (!gallery) return;
      gallery.removeAttribute('data-pinned');
      gallery.style.height = '';
      if (track) track.style.transform = '';
    });

    // ---- The follower ring.
    const ring = fine ? document.createElement('div') : null;
    if (ring) {
      ring.className = 'ed-cursor';
      ring.setAttribute('aria-hidden', 'true');
      ring.innerHTML = '<span>View</span>';
      document.body.appendChild(ring);
      cleanups.push(() => ring.remove());
    }
    let rx = -100;
    let ry = -100;
    let scrolled = false;

    /** What the ring should say about the thing under the pointer. */
    const aim = (target: Element | null) => {
      if (!ring) return;
      ring.toggleAttribute('data-view', !!target?.closest('.ed-panel'));
      ring.toggleAttribute('data-link', !!target?.closest('a, button, [role="button"], input, textarea'));
    };

    let heroHeight = hero?.offsetHeight ?? 0;
    let pointerMoved = false;

    // Each frame reads every position it needs first, then writes: reading layout after a write
    // would make the browser recalculate it again mid-frame, which is what makes scrolling stutter.
    const draw = () => {
      frame = 0;
      // ---- Read.
      const y = window.scrollY;
      const vh = window.innerHeight;
      const storyRect = story?.getBoundingClientRect();
      const galleryTop = gallery && travel ? gallery.getBoundingClientRect().top : 0;
      const nearChars = fine && pointerMoved && y < heroHeight ? chars.map((ch) => ch.getBoundingClientRect()) : null;
      const under = ring && scrolled && px > -1e3 ? document.elementFromPoint(px, py) : undefined;

      // ---- Compute and write.
      velocity = velocity * 0.85 + (y - lastY) * 0.15;
      lastY = y;
      // Transforms on the moving elements themselves: a variable on a parent would restyle everything inside it.
      if (y < heroHeight + 200) {
        const s = Math.min(y, 900);
        lines.forEach((line, i) => (line.style.transform = `translate3d(${s * (LINE_RATES[i] ?? 0)}px, 0, 0)`));
      }
      // How far through the chapters the reader is (the line down the left fills with it).
      if (storyFill && storyRect) {
        const p = Math.min(1, Math.max(0, (vh * 0.6 - storyRect.top) / Math.max(storyRect.height, 1)));
        storyFill.style.transform = `scaleY(${p.toFixed(4)})`;
      }
      // Letters toward the pointer get wider and heavier (only when the pointer has moved).
      if (nearChars) {
        pointerMoved = false;
        nearChars.forEach((r, i) => {
          const k = Math.max(0, 1 - Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2)) / near);
          chars[i].style.setProperty('--wd', String(Math.round(62 + k * 60)));
          chars[i].style.setProperty('--wg', String(Math.round(780 + k * 120)));
        });
      }
      if (tickerAnimation) {
        const speed = 1 + Math.min(6, Math.abs(velocity) / 6);
        tickerAnimation.playbackRate = velocity < -0.5 ? -speed : speed;
      }
      if (gallery && track && travel) {
        const progress = Math.min(1, Math.max(0, -galleryTop / travel));
        track.style.transform = `translate3d(${-progress * travel}px, 0, 0)`;
      }
      if (ring) {
        // After a scroll something else can be under a pointer that hasn't moved.
        if (under !== undefined) aim(under);
        scrolled = false;
        rx += (px - rx) * 0.22;
        ry += (py - ry) * 0.22;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        if (Math.abs(px - rx) > 0.3 || Math.abs(py - ry) > 0.3) queue();
      }
      if (Math.abs(velocity) > 0.3) queue();
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX;
      py = e.clientY;
      pointerMoved = true;
      if (ring) {
        aim(e.target instanceof Element ? e.target : null);
        ring.toggleAttribute('data-on', true);
      }
      queue();
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        px = py = -1e4;
        pointerMoved = true; // let the letters settle back
        ring?.removeAttribute('data-on');
        queue();
      }
    };
    const onScroll = () => {
      scrolled = true;
      queue();
    };
    const onResize = () => {
      measure();
      heroHeight = hero?.offsetHeight ?? 0;
      queue();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('mouseout', onLeave);
    queue();
    cleanups.push(() => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mouseout', onLeave);
      lines.forEach((line) => (line.style.transform = ''));
      if (storyFill) storyFill.style.transform = '';
      chars.forEach((ch) => {
        ch.style.removeProperty('--wd');
        ch.style.removeProperty('--wg');
      });
      if (tickerAnimation) tickerAnimation.playbackRate = 1;
    });

    return () => cleanups.forEach((fn) => fn());
  }, [active, pathname, mounts]);

  return null;
}
