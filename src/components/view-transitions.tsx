'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type StartViewTransition = (update: () => Promise<void>) => unknown;

/**
 * Smooth page-to-page transitions with the browser's View Transitions API.
 * In-site link clicks are caught before Next's own handler, and the route
 * change runs inside document.startViewTransition: the old page is captured,
 * the new one renders, and the browser animates between them (cross-fade, plus
 * the elements named in globals.css such as the portrait and the page title).
 * Browsers without the API, and visitors who prefer reduced motion, get the
 * normal navigation untouched.
 */
export function ViewTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const finish = useRef<(() => void) | null>(null);

  // The new route has rendered: let the browser capture it and animate.
  useEffect(() => {
    finish.current?.();
    finish.current = null;
  }, [pathname]);

  useEffect(() => {
    const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
    if (!start || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || !a.href || a.target && a.target !== '_self' || a.hasAttribute('download')) return;
      const url = new URL(a.href);
      if (url.origin !== location.origin) return;
      // Same page (or only the #hash changes): nothing to transition.
      if (url.pathname === location.pathname && url.search === location.search) return;
      // Routes outside the app router (feeds, files) load normally.
      if (/\.(xml|txt|pdf|json|webmanifest)$/.test(url.pathname) || url.pathname.startsWith('/api/')) return;

      // Next's <Link> skips its own navigation when the default is prevented, while the
      // link's other click handlers (closing a menu, say) still run.
      e.preventDefault();
      const href = url.pathname + url.search + url.hash;
      start.call(document, () => {
        return new Promise<void>((resolve) => {
          // Never hold the old frame for long if the route is slow.
          const timer = window.setTimeout(resolve, 1200);
          // Called once the new route has committed to the DOM. (Not via requestAnimationFrame:
          // the browser pauses frames while it waits for this update.)
          finish.current = () => {
            window.clearTimeout(timer);
            resolve();
          };
          router.push(href);
        });
      });
    };

    // Capture on window runs before React's delegated handlers.
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [router]);

  return null;
}
