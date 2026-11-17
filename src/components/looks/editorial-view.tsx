'use client';

import { useEffect, type ComponentProps, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { DesignStyle } from '@/lib/design-style';
import { useActiveLook } from './look-view';

/**
 * Editorial's homepage and its Experience, About and Projects blocks, in the page only when Editorial
 * is the active look (see look-view.tsx): the server renders them when Editorial is the default, and a
 * visitor who picked it loads them on demand. Other sites on the platform, always in Editorial, render
 * the components directly on the server.
 */

/** Tells editorial-fx that Editorial's blocks are now in the page, so it sets up their motion again. */
export const EDITORIAL_MOUNTED = 'editorial:mounted';
function announced<P extends object>(View: ComponentType<P>) {
  return function Announced(props: P) {
    useEffect(() => {
      window.dispatchEvent(new Event(EDITORIAL_MOUNTED));
    }, []);
    return <View {...props} />;
  };
}

const Home = dynamic(() => import('@/components/editorial/editorial-home').then((m) => announced(m.EditorialHome)));
const Journey = dynamic(() => import('@/components/editorial/editorial-journey').then((m) => announced(m.EditorialJourney)));
const About = dynamic(() => import('@/components/editorial/editorial-about').then((m) => announced(m.EditorialAbout)));
const CaseFiles = dynamic(() => import('@/components/editorial/editorial-case-files').then((m) => announced(m.EditorialCaseFiles)));

type Props = {
  home: ComponentProps<typeof import('@/components/editorial/editorial-home').EditorialHome>;
  experience: ComponentProps<typeof import('@/components/editorial/editorial-journey').EditorialJourney>;
  about: ComponentProps<typeof import('@/components/editorial/editorial-about').EditorialAbout>;
  projects: ComponentProps<typeof import('@/components/editorial/editorial-case-files').EditorialCaseFiles>;
};
const VIEWS = { home: Home, experience: Journey, about: About, projects: CaseFiles };

export function EditorialView<P extends keyof Props>({ page, defaultLook, props }: { page: P; defaultLook: DesignStyle; props: Props[P] }) {
  const look = useActiveLook(defaultLook);
  if (look !== 'editorial') return null;
  const View = VIEWS[page] as unknown as React.ComponentType<Props[P]>;
  return <View {...props} />;
}
