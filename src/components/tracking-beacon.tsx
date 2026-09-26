'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

/**
 * Privacy-first page-view counter. Sends only the path, the referrer and a
 * utm_source to the API: no cookies, no ids, nothing stored in the browser.
 * The API keeps only the referrer's host and a daily-salted visitor hash.
 * Skipped with Do Not Track or Global Privacy Control, on admin pages, and
 * when NEXT_PUBLIC_API_URL isn't set. Sent after the page is idle.
 */
export function TrackingBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!API_URL || !pathname || pathname.startsWith('/admin')) return;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === '1' || nav.globalPrivacyControl) return;

    const send = () => {
      const utmSource = new URLSearchParams(window.location.search).get('utm_source') ?? '';
      fetch(`${API_URL}/api/TrackPageView`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname, referrer: document.referrer, utmSource: utmSource.slice(0, 64) }),
        credentials: 'omit',
        keepalive: true,
      }).catch(() => {});
    };
    const idle = window.requestIdleCallback?.(send, { timeout: 4000 });
    const timer = idle === undefined ? window.setTimeout(send, 1500) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
