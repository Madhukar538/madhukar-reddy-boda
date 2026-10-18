'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * The liquid that carries the desktop nav between the top bar and the right-edge dock.
 *
 * A few glass-coloured blobs are drawn through a "goo" filter (blur, then a hard alpha
 * threshold), so blobs that come close melt into one shape with a soft neck between them.
 * Docking: the capsule melts into a blob that runs along the top edge with drops trailing
 * behind it, pools in the corner, then pours down the right edge with a bulging front.
 * Undocking plays the same timeline backwards. Only mounted while it runs.
 */

/** One timeline for both directions; the CSS in globals.css (.nav-flow-*) is timed to it. */
export const LIQUID_MS = 1000;

type Box = { x: number; y: number; w: number; h: number };
type Frame = Box & { offset: number; easing?: string };

const flow = 'cubic-bezier(0.55, 0, 0.3, 1)';
const pour = 'cubic-bezier(0.4, 0, 0.2, 1)';

function frames(list: Frame[]): Keyframe[] {
  return list.map(({ x, y, w, h, offset, easing }) => ({
    offset,
    easing,
    transform: `translate(${x}px, ${y}px)`,
    width: `${w}px`,
    height: `${h}px`,
  }));
}

export function NavLiquid({
  docked,
  capsuleRef,
  dockRef,
}: {
  docked: boolean;
  capsuleRef: RefObject<HTMLElement | null>;
  dockRef: RefObject<HTMLElement | null>;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const previous = useRef(docked);

  useEffect(() => {
    const was = previous.current;
    previous.current = docked;
    const layer = layerRef.current;
    const capsule = capsuleRef.current;
    const dock = dockRef.current;
    if (was === docked || !layer || !capsule || !dock) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Both ends of the trip, measured where they sit at rest (transforms aside).
    const c = capsule.getBoundingClientRect();
    const d = dock.getBoundingClientRect();
    const drop = d.width; // the bead that gathers in the corner is as wide as the dock
    const corner: Box = { x: d.right - drop, y: c.top, w: drop, h: drop };

    const blobs = [...layer.querySelectorAll<HTMLElement>('[data-blob]')];
    const [body, neck, tail1, tail2, head] = blobs;
    const options: KeyframeAnimationOptions = {
      duration: LIQUID_MS,
      fill: 'both',
      direction: docked ? 'normal' : 'reverse',
    };

    layer.hidden = false;
    const runs = [
      // The main body: the capsule shape, squeezed along the top into a bead, then poured down.
      body.animate(frames([
        { offset: 0, x: c.left, y: c.top, w: c.width, h: c.height, easing: flow },
        { offset: 0.42, x: corner.x - 24, y: c.top + 2, w: drop + 40, h: c.height - 6, easing: 'ease-out' },
        { offset: 0.5, ...corner, easing: pour },
        { offset: 0.86, x: d.left, y: d.top, w: d.width, h: d.height },
        { offset: 1, x: d.left, y: d.top, w: d.width, h: d.height },
      ]), options),
      // A neck that lags behind the body, so it stretches like a drop leaving a pool.
      neck.animate(frames([
        { offset: 0, x: c.left + c.width * 0.15, y: c.top + 4, w: c.width * 0.5, h: c.height - 8, easing: flow },
        { offset: 0.5, x: corner.x - 60, y: c.top + 8, w: 70, h: c.height - 16, easing: flow },
        { offset: 0.62, x: corner.x + 6, y: c.top + 10, w: drop - 12, h: drop - 20 },
        { offset: 1, x: corner.x + 6, y: c.top + 10, w: drop - 12, h: drop - 20 },
      ]), options),
      // Two trailing drops that pinch off and catch up.
      tail1.animate(frames([
        { offset: 0, x: c.left + c.width * 0.12, y: c.top + 10, w: 28, h: 28, easing: flow },
        { offset: 0.56, x: corner.x - 34, y: c.top + 12, w: 22, h: 22, easing: 'ease-in' },
        { offset: 0.68, x: corner.x + 14, y: c.top + 14, w: 18, h: 18 },
        { offset: 1, x: corner.x + 14, y: c.top + 14, w: 18, h: 18 },
      ]), options),
      tail2.animate(frames([
        { offset: 0, x: c.left + c.width * 0.3, y: c.top + 14, w: 20, h: 20, easing: flow },
        { offset: 0.64, x: corner.x - 70, y: c.top + 16, w: 16, h: 16, easing: 'ease-in' },
        { offset: 0.78, x: corner.x + 18, y: c.top + 18, w: 12, h: 12 },
        { offset: 1, x: corner.x + 18, y: c.top + 18, w: 12, h: 12 },
      ]), options),
      // The bulging front of the pour: rides the bottom of the body down the edge, a little
      // wider than it, then settles back as the tabs appear.
      head.animate(frames([
        { offset: 0, x: c.right - c.height, y: c.top + 4, w: c.height - 8, h: c.height - 8, easing: flow },
        { offset: 0.42, x: corner.x + 4, y: c.top + 4, w: drop - 8, h: c.height - 8, easing: 'ease-out' },
        { offset: 0.5, x: corner.x - 2, y: corner.y, w: drop + 4, h: drop, easing: pour },
        { offset: 0.86, x: d.left - 4, y: d.bottom - drop + 4, w: d.width + 8, h: drop + 6, easing: 'ease-out' },
        { offset: 0.94, x: d.left, y: d.bottom - drop, w: d.width, h: drop },
        { offset: 1, x: d.left, y: d.bottom - drop, w: d.width, h: drop },
      ]), options),
      // Fade the liquid in over the leaving element and out under the arriving one.
      layer.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.86 }, { opacity: 0 }],
        options,
      ),
    ];

    let cancelled = false;
    Promise.all(runs.map((a) => a.finished)).then(
      () => {
        if (!cancelled) layer.hidden = true;
      },
      () => {},
    );
    return () => {
      cancelled = true;
      runs.forEach((a) => a.cancel());
    };
  }, [docked, capsuleRef, dockRef]);

  return (
    <div ref={layerRef} hidden aria-hidden className="nav-liquid">
      <svg width="0" height="0" className="absolute">
        <filter id="nav-goo" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" result="goo" />
          {/* A thin bright rim along the surface, like light catching the edge of glass. */}
          <feMorphology in="goo" operator="erode" radius="1.5" result="inner" />
          <feComposite in="goo" in2="inner" operator="out" result="rim" />
          <feColorMatrix in="rim" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.4 0" result="highlight" />
          <feMerge>
            <feMergeNode in="goo" />
            <feMergeNode in="highlight" />
          </feMerge>
        </filter>
      </svg>
      <div className="nav-liquid-blobs">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} data-blob />
        ))}
      </div>
    </div>
  );
}
