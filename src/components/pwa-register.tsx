'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

// Changes on every deployment (see next.config.ts), which makes the browser
// install a fresh service worker with a fresh cache.
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';
const UPDATE_CHECK_MS = 30 * 60 * 1000;

export function PWARegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      // Avoid stale chunks fighting with HMR in development.
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;
    let reloading = false;

    const trackInstalling = (worker: ServiceWorker | null) => {
      worker?.addEventListener('statechange', () => {
        // Only prompt when replacing an existing worker, not on first install.
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          setWaiting(worker);
        }
      });
    };

    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const checkForUpdate = () => {
      if (document.visibilityState === 'visible') registration?.update().catch(() => {});
    };

    navigator.serviceWorker
      // updateViaCache 'none' stops the HTTP cache from hiding a new sw.js.
      .register(`/sw.js?v=${encodeURIComponent(BUILD_ID)}`, { updateViaCache: 'none' })
      .then((reg) => {
        registration = reg;
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        trackInstalling(reg.installing);
        reg.addEventListener('updatefound', () => trackInstalling(reg.installing));
      })
      .catch((err) => console.error('Service worker registration failed:', err));

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', checkForUpdate);
    const timer = window.setInterval(checkForUpdate, UPDATE_CHECK_MS);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', checkForUpdate);
      window.clearInterval(timer);
    };
  }, []);

  const applyUpdate = () => {
    // The worker activates, fires controllerchange, and the page reloads.
    waiting?.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <AnimatePresence>
      {waiting && !dismissed && (
        <m.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          role="status"
          className="fixed inset-x-0 bottom-28 lg:bottom-6 z-[150] flex justify-center px-4 pointer-events-none"
        >
          <div className="glass glass-strong glass-pill pointer-events-auto flex items-center gap-2 py-1.5 pl-4 pr-1.5 text-sm">
            <span className="text-foreground/85">A new version is available.</span>
            <button type="button" onClick={applyUpdate} className="tinted-button !px-3.5 !py-1.5 !text-[13px]">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
