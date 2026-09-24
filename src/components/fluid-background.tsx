'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_FLUID, FluidSim } from '@/lib/fluid/fluid-sim';

/**
 * Live fluid layer behind the glass. The cursor (or a finger) stirs dye in
 * the current theme's colours, and it drifts on its own when nobody's moving.
 * Devices that can't run it, or visitors who asked for less motion or data,
 * keep the static gradient blobs; nothing here renders for them.
 */

type RGB = [number, number, number];

const PALETTE_VARS = ['--blob-a', '--blob-b', '--blob-c', '--blob-d'];

function hslToRgb(h: number, s: number, l: number): RGB {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

/** Reads the wallpaper palette ("211 100% 50%" style vars) as linear-ish RGB. */
function readPalette(): RGB[] {
  const style = getComputedStyle(document.documentElement);
  const primary = style.getPropertyValue('--primary').trim();
  return PALETTE_VARS.map((name) => {
    const raw = style.getPropertyValue(name).trim();
    const value = raw.startsWith('var(') ? primary : raw;
    const [h, s, l] = value.split(/\s+/).map((v) => parseFloat(v));
    if ([h, s, l].some((n) => Number.isNaN(n))) return [0.2, 0.4, 1] as RGB;
    return hslToRgb(h, s / 100, l / 100);
  });
}

function shouldRun() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  // Low-end hardware keeps the static blobs.
  if ((nav.hardwareConcurrency ?? 8) < 4 || (nav.deviceMemory ?? 8) < 4) return false;
  return true;
}

/**
 * Starts the simulation on `canvas`. Returns its cleanup, or undefined when
 * the device can't run it.
 */
function startFluid(canvas: HTMLCanvasElement, setActive: (on: boolean) => void): (() => void) | undefined {
  const isDark = () => document.documentElement.classList.contains('dark');
  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
  };
  size();

  const touch = window.matchMedia('(pointer: coarse)').matches;
  // Phones get a lighter simulation: fewer dye pixels and pressure passes.
  const sim = FluidSim.create(canvas, touch ? { ...DEFAULT_FLUID, dyeResolution: 384, pressureIterations: 10 } : { ...DEFAULT_FLUID });
  if (!sim) return undefined;

  let palette = readPalette();
  const applyTheme = () => {
    palette = readPalette();
    // Dye is added on top of the page: keep it gentler on a light background.
    sim.config.intensity = isDark() ? 0.65 : 0.6;
  };
  applyTheme();
  setActive(true);

  let colorIndex = 0;
  const nextColor = (strength: number): RGB => {
    colorIndex = (colorIndex + 1) % (palette.length * 24);
    const c = palette[Math.floor(colorIndex / 24)];
    return [c[0] * strength, c[1] * strength, c[2] * strength];
  };

  // Pointer input, in UV space with y up.
  let last: { x: number; y: number } | null = null;
  const onMove = (e: PointerEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = 1 - e.clientY / window.innerHeight;
    if (last) {
      const dx = x - last.x;
      const dy = y - last.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.0005) {
        const f = sim.config.splatForce;
        sim.splat(x, y, dx * f, dy * f, nextColor(0.18));
      }
    }
    last = { x, y };
    idleSince = performance.now();
  };
  const onLeave = () => {
    last = null;
  };

  // Ambient drift: a few slow currents wander when there's no input.
  let idleSince = 0;
  let ambientAt = 0;
  const ambient = (now: number) => {
    if (now - idleSince < 2500 || now < ambientAt) return;
    ambientAt = now + 900 + Math.random() * 900;
    const t = now / 1000;
    const x = 0.5 + 0.38 * Math.sin(t * 0.23 + colorIndex);
    const y = 0.5 + 0.34 * Math.cos(t * 0.17 + colorIndex * 0.5);
    const angle = t * 0.4 + Math.random() * Math.PI * 2;
    const speed = 380 + Math.random() * 380;
    sim.splat(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, nextColor(0.12));
  };

  // Opening swirl so the effect is visible straight away.
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    sim.splat(0.5 + Math.cos(angle) * 0.28, 0.5 + Math.sin(angle) * 0.28, -Math.sin(angle) * 900, Math.cos(angle) * 900, nextColor(0.2));
    colorIndex += 24;
  }

  let frame = 0;
  let prev = performance.now();
  let slowFrames = 0;
  const paused = () => document.hidden || document.documentElement.dataset.osMode === 'on';

  const loop = (now: number) => {
    frame = requestAnimationFrame(loop);
    const elapsed = now - prev;
    prev = now;
    if (paused()) return;

    // Give up on devices that can't keep up; the CSS blobs take over.
    slowFrames = elapsed > 50 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 90) {
      stop(true);
      return;
    }

    ambient(now);
    sim.step(Math.min(elapsed / 1000, 1 / 30));
    sim.render();
  };
  frame = requestAnimationFrame(loop);

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      size();
      sim.resize();
    }, 150);
  };

  // Re-read colours when the theme or accent changes.
  const observer = new MutationObserver(applyTheme);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-accent'] });

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', onResize);

  let stopped = false;
  // Only drop the GL context when giving up for good; an unmount (or a dev
  // StrictMode re-run) must leave the canvas usable for the next mount.
  const stop = (loseContext = false) => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    clearTimeout(resizeTimer);
    observer.disconnect();
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', onResize);
    if (loseContext) sim.dispose();
    setActive(false);
  };
  return () => stop();
}

// Any of these means someone is here and interacting.
const WAKE_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'] as const;

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  // The simulation redraws every frame, which is expensive before the page is
  // even usable. So the static blobs show first and the fluid starts on the
  // first interaction, in an idle moment after it.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldRun()) return;

    let cleanup: (() => void) | undefined;
    let idle = 0;
    // Safari has no requestIdleCallback.
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const onIdle = (cb: () => void) => (hasIdle ? window.requestIdleCallback(cb, { timeout: 1500 }) : window.setTimeout(cb, 200));
    const cancelIdle = (id: number) => (hasIdle ? window.cancelIdleCallback(id) : window.clearTimeout(id));

    const unlisten = () => WAKE_EVENTS.forEach((e) => window.removeEventListener(e, wake));
    function wake() {
      unlisten();
      idle = onIdle(() => {
        cleanup = startFluid(canvas!, setActive);
      });
    }
    WAKE_EVENTS.forEach((e) => window.addEventListener(e, wake, { passive: true }));

    return () => {
      unlisten();
      cancelIdle(idle);
      cleanup?.();
    };
  }, []);

  return <canvas ref={canvasRef} className="fluid-canvas" data-active={active || undefined} />;
}
