'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

export type MarqueePost = { slug: string; title: string; excerpt: string; date: string; readTime: string; category: string };

const SPEED = 28; // px per second while drifting
const FRICTION = 0.94; // per-frame decay of a flick after release

/**
 * An endless, draggable strip of post cards. It drifts on its own, can be
 * dragged or flicked with mouse or touch, pauses on hover or keyboard focus,
 * and only animates while it's on screen. Reduced-motion visitors get a
 * still strip that can still be dragged.
 */
export function BlogMarquee({ posts }: { posts: MarqueePost[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let offset = 0; // px, 0 .. -loopWidth
    let loop = track.scrollWidth / 2; // the list is rendered twice
    let velocity = 0; // px per frame, from a flick
    let hovering = false;
    let focused = false;
    let visible = false;
    let frame = 0;
    let last = 0;

    const wrap = () => {
      if (loop <= 0) return;
      offset = ((offset % loop) + loop) % loop - loop;
    };
    const paint = () => {
      track.style.transform = `translate3d(${offset}px,0,0)`;
    };

    // Drag state.
    let dragging = false;
    let moved = 0;
    let startX = 0;
    let startOffset = 0;
    let lastX = 0;
    let lastT = 0;

    const tick = (now: number) => {
      frame = 0;
      const dt = last ? Math.min(now - last, 64) / 1000 : 0;
      last = now;
      if (!dragging) {
        if (Math.abs(velocity) > 0.05) {
          offset += velocity;
          velocity *= FRICTION;
        } else if (!reduced && !hovering && !focused) {
          offset -= SPEED * dt;
        }
        wrap();
        paint();
      }
      schedule();
    };
    const schedule = () => {
      const idle = reduced && Math.abs(velocity) <= 0.05 && !dragging;
      if (!frame && visible && !document.hidden && !idle) frame = requestAnimationFrame(tick);
      else if (idle) last = 0;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = lastX = e.clientX;
      lastT = performance.now();
      startOffset = offset;
      velocity = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      moved = Math.max(moved, Math.abs(e.clientX - startX));
      // Only a real drag captures the pointer; a plain click must still reach the card's link.
      if (moved > 6 && !viewport.hasPointerCapture(e.pointerId)) {
        viewport.setPointerCapture(e.pointerId);
        viewport.dataset.dragging = 'true';
      }
      offset = startOffset + (e.clientX - startX);
      // Velocity in px per frame (~16 ms), for the flick on release.
      velocity = ((e.clientX - lastX) / Math.max(now - lastT, 1)) * 16;
      lastX = e.clientX;
      lastT = now;
      wrap();
      paint();
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      delete viewport.dataset.dragging;
      if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
      if (performance.now() - lastT > 80) velocity = 0; // held still before letting go
      last = 0;
      schedule();
    };
    // A drag must not also open the card it started on.
    const onClick = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      velocity = e.key === 'ArrowLeft' ? 14 : -14;
      schedule();
    };

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      last = 0;
      schedule();
    });
    visibility.observe(viewport);

    const resize = new ResizeObserver(() => {
      loop = track.scrollWidth / 2;
      wrap();
      paint();
    });
    resize.observe(track);

    const enter = () => (hovering = true);
    const leave = () => (hovering = false);
    const focusIn = () => (focused = true);
    const focusOut = (e: FocusEvent) => {
      if (!viewport.contains(e.relatedTarget as Node | null)) focused = false;
    };
    const onVisibility = () => {
      last = 0;
      schedule();
    };

    viewport.addEventListener('pointerdown', onDown);
    viewport.addEventListener('pointermove', onMove);
    viewport.addEventListener('pointerup', onUp);
    viewport.addEventListener('pointercancel', onUp);
    viewport.addEventListener('click', onClick, true);
    viewport.addEventListener('keydown', onKey);
    viewport.addEventListener('pointerenter', enter);
    viewport.addEventListener('pointerleave', leave);
    viewport.addEventListener('focusin', focusIn);
    viewport.addEventListener('focusout', focusOut);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resize.disconnect();
      viewport.removeEventListener('pointerdown', onDown);
      viewport.removeEventListener('pointermove', onMove);
      viewport.removeEventListener('pointerup', onUp);
      viewport.removeEventListener('pointercancel', onUp);
      viewport.removeEventListener('click', onClick, true);
      viewport.removeEventListener('keydown', onKey);
      viewport.removeEventListener('pointerenter', enter);
      viewport.removeEventListener('pointerleave', leave);
      viewport.removeEventListener('focusin', focusIn);
      viewport.removeEventListener('focusout', focusOut);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [posts]);

  const card = (post: MarqueePost, copy: boolean) => (
    <Link
      key={`${copy ? 'b' : 'a'}-${post.slug}`}
      href={`/blog/${post.slug}`}
      draggable={false}
      tabIndex={copy ? -1 : undefined}
      aria-hidden={copy || undefined}
      className="marquee-card group flex w-[17rem] shrink-0 flex-col p-5 sm:w-[20rem]"
    >
      <span className="mb-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="truncate font-semibold uppercase tracking-wide">{post.category}</span>
        <span className="flex shrink-0 items-center gap-1">
          <Clock className="h-3 w-3" />
          {post.readTime}
        </span>
      </span>
      <span className="line-clamp-3 font-semibold leading-snug text-foreground group-hover:text-primary">{post.title}</span>
      <span className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</span>
      <span className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
        {post.date}
        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );

  return (
    <div
      ref={viewportRef}
      role="region"
      aria-label="Blog posts, draggable. Use the left and right arrow keys to scroll."
      tabIndex={0}
      className="blog-marquee -mx-4 cursor-grab select-none overflow-hidden px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary md:mx-0 md:px-0"
    >
      <div ref={trackRef} className="flex w-max gap-4 pr-4">
        {posts.map((p) => card(p, false))}
        {posts.map((p) => card(p, true))}
      </div>
    </div>
  );
}
