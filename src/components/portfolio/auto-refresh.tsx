'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Re-runs the page's server checks every `seconds` while the tab is visible (the /status page). */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);
  return null;
}
