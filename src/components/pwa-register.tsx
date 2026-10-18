'use client';

import { useEffect } from 'react';
import { appIsOutdated, markOutdated } from '@/lib/app-version';

// Changes on every deployment (see next.config.ts), which makes the browser
// install a fresh service worker with a fresh cache.
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';
const VERSION_CHECK_MS = 5 * 60 * 1000;

/** The build id of the live deployment, or null when it can't be reached. */
async function liveBuildId() {
  try {
    const response = await fetch('/api/version', { cache: 'no-store' });
    if (!response.ok) return null;
    return ((await response.json()) as { buildId?: string }).buildId ?? null;
  } catch {
    return null;
  }
}

/**
 * Registers the service worker and keeps every open tab on the latest
 * deployment. A tab checks the live build id when it regains focus, every few
 * minutes, and on the first in-site link click after a while; when a newer
 * version is out it reloads onto it:
 * - at once if the tab is in the background (nobody sees it happen);
 * - when the tab is shown again;
 * - otherwise on the next in-site link click, so a visitor is never pulled off
 *   what they are reading mid-way.
 * Renders nothing.
 */
export function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      // Avoid stale chunks fighting with HMR in development.
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      return;
    }

    navigator.serviceWorker
      // updateViaCache 'none' stops the HTTP cache from hiding a new sw.js.
      .register(`/sw.js?v=${encodeURIComponent(BUILD_ID)}`, { updateViaCache: 'none' })
      .catch((err) => console.error('Service worker registration failed:', err));

    let checkedAt = Date.now();

    const check = async () => {
      checkedAt = Date.now();
      const live = await liveBuildId();
      if (live && live !== BUILD_ID) {
        markOutdated();
        if (document.visibilityState === 'hidden') window.location.reload();
      }
    };

    // Coming back to the tab is a natural moment to switch versions.
    const onVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      if (!appIsOutdated()) await check();
      if (appIsOutdated()) window.location.reload();
    };

    // An in-site link click becomes a full page load when a newer version is
    // out, so the next page comes from the new build.
    // (The page-transition handler runs first and steps aside once outdated.)
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest('a');
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (appIsOutdated()) {
        if (e.defaultPrevented) return;
        e.preventDefault();
        window.location.assign(url.href);
      } else if (Date.now() - checkedAt > 60_000) {
        void check();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('click', onClick, true);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void check();
    }, VERSION_CHECK_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('click', onClick, true);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
