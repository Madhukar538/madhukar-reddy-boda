'use client';

import { useEffect, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { currentDesignStyle, type DesignStyle } from '@/lib/design-style';
import type { LookHomeProps } from './types';
import type { AboutProps, ExperienceProps, ProjectsProps } from './pages-types';

/**
 * Shows the active look's own homepage, or its Experience, About or Projects block. Only that one
 * is in the page: the server renders the site's default look (pages are static, and the visitor's
 * choice lives in their browser), and a visitor in another look loads just that look's code here,
 * once, when the page starts. Editorial has its own (editorial-view.tsx); Midnight's classic blocks are
 * always on the server, so nothing is shown here for either.
 */

type Page = 'home' | 'experience' | 'about' | 'projects';
type PropsFor = { home: LookHomeProps; experience: ExperienceProps; about: AboutProps; projects: ProjectsProps };

// Each look's module, split into its own chunk. A component per page, picked by name from it.
const load = {
  arctic: { home: () => import('./arctic-home').then((m) => m.ArcticHome), pages: () => import('./arctic-pages') },
  synthwave: { home: () => import('./synthwave-home').then((m) => m.SynthwaveHome), pages: () => import('./synthwave-pages') },
  dune: { home: () => import('./dune-home').then((m) => m.DuneHome), pages: () => import('./dune-pages') },
  gazette: { home: () => import('./gazette').then((m) => m.GazetteHome), pages: () => import('./gazette') },
  receipt: { home: () => import('./receipt').then((m) => m.ReceiptHome), pages: () => import('./receipt') },
  observatory: { home: () => import('./observatory').then((m) => m.ObservatoryHome), pages: () => import('./observatory') },
  terminal: { home: () => import('./terminal-look').then((m) => m.TerminalHome), pages: () => import('./terminal-look') },
  blueprint: { home: () => import('./blueprint-look').then((m) => m.BlueprintHome), pages: () => import('./blueprint-look') },
  glass: { home: () => import('./glass-look').then((m) => m.GlassHome), pages: () => import('./glass-look') },
  bazaar: { home: () => import('./bazaar').then((m) => m.BazaarHome), pages: () => import('./bazaar') },
} as const;

type Look = keyof typeof load;
const NAMES: Record<Look, string> = {
  arctic: 'Arctic', synthwave: 'Synthwave', dune: 'Dune', gazette: 'Gazette', receipt: 'Receipt',
  observatory: 'Observatory', terminal: 'Terminal', blueprint: 'Blueprint', glass: 'Glass', bazaar: 'Bazaar',
};
const SUFFIX = { experience: 'Experience', about: 'About', projects: 'Projects' } as const;

// One dynamic component per look and page, made once (making them during render would remount them).
const views = Object.fromEntries(
  (Object.keys(load) as Look[]).map((look) => [
    look,
    {
      home: dynamic(load[look].home),
      ...Object.fromEntries(
        (Object.keys(SUFFIX) as (keyof typeof SUFFIX)[]).map((page) => [
          page,
          dynamic(() => load[look].pages().then((m) => (m as unknown as Record<string, ComponentType<never>>)[`${NAMES[look]}${SUFFIX[page]}`])),
        ])
      ),
    },
  ])
) as unknown as Record<Look, { [P in Page]: ComponentType<PropsFor[P]> }>;

/**
 * The look on the page: the default look first, as the server rendered it, then the page's own (the
 * inline script has set it from the visitor's choice) and any change made in the picker.
 */
export function useActiveLook(defaultLook: DesignStyle) {
  const [look, setLook] = useState<DesignStyle>(defaultLook);
  useEffect(() => {
    setLook(currentDesignStyle());
    const observer = new MutationObserver(() => setLook(currentDesignStyle()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-style'] });
    return () => observer.disconnect();
  }, []);
  return look;
}

export function LookView<P extends Page>({ page, defaultLook, props }: { page: P; defaultLook: DesignStyle; props: PropsFor[P] }) {
  const look = useActiveLook(defaultLook);
  if (!(look in views)) return null;
  const View = views[look as Look][page] as ComponentType<PropsFor[P]>;
  return <View {...props} />;
}
