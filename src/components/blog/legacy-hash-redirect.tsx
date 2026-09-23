'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Old single-page anchors (/#skills etc.) now live on their own pages.
const legacyHashes: Record<string, string> = {
  about: '/about',
  skills: '/about#skills',
  education: '/about#education',
  experience: '/experience',
  projects: '/projects',
  research: '/lab',
};

export function LegacyHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const target = legacyHashes[window.location.hash.slice(1)];
    if (target) router.replace(target);
  }, [router]);
  return null;
}
