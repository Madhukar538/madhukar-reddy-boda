'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
          .catch((err) => console.error('Service Worker registration failed:', err));
      } else {
        // Unregister service worker in development to prevent caching issues with Turbopack/HMR
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log('Development mode: Unregistered active service worker to prevent HMR chunk conflicts');
              }
            });
          }
        });
      }
    }
  }, []);

  return null;
}
