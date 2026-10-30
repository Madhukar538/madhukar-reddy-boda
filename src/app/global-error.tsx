'use client';

import { useEffect } from 'react';
import { CHUNK_ERROR, reloadForNewBuild } from '@/lib/chunk-reload';

/** Last-resort screen when the app itself fails to render. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isStaleBuild = CHUNK_ERROR.test(`${error?.name} ${error?.message}`);

  useEffect(() => {
    if (isStaleBuild) reloadForNewBuild();
  }, [isStaleBuild]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#110f0d', color: '#ede8e1', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>{isStaleBuild ? 'Loading the latest version…' : 'Something went wrong.'}</h1>
          <p style={{ margin: '0 0 20px', color: '#a9b6cc', lineHeight: 1.5 }}>
            {isStaleBuild ? 'The site was just updated.' : 'Please try again. If it keeps happening, a reload usually fixes it.'}
          </p>
          <button
            type="button"
            onClick={() => (isStaleBuild ? window.location.reload() : reset())}
            style={{ padding: '10px 20px', borderRadius: 999, border: 0, background: '#1e4fd6', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
