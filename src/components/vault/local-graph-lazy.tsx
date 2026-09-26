'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { LocalGraph } from '@/lib/vault';

const LocalGraphView = dynamic(() => import('./local-graph'), { ssr: false });

/**
 * Loads the local graph (and d3-force) only on desktop-width screens, after
 * the page has painted, so it never competes with the article itself.
 */
export function LocalGraphLazy({ graph }: { graph: LocalGraph }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    let idle = 0;
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const schedule = () => {
      if (!wide.matches) return;
      idle = hasIdle ? window.requestIdleCallback(() => setShow(true), { timeout: 2000 }) : window.setTimeout(() => setShow(true), 300);
    };
    schedule();
    wide.addEventListener('change', schedule);
    return () => {
      wide.removeEventListener('change', schedule);
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  if (graph.nodes.length < 3) return null;
  return show ? <LocalGraphView graph={graph} /> : <div className="hidden lg:block glass h-[19rem]" aria-hidden />;
}
