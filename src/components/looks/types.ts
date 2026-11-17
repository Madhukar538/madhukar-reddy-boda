import type { ReactNode } from 'react';
import type { ProjectCard } from '@/data/profile';
import type { PostSummary } from '@/lib/blog';

/**
 * What every look's own homepage (Arctic, Synthwave, Dune) is built from. Like Editorial's, each one
 * is in the page for every look and shown only in its own (globals.css), so switching needs no request.
 */
export type LookHomeProps = {
  /** One sentence for screen readers: the page's heading in this look. */
  heading: string;
  name: string;
  projects: LookProject[];
  metrics: { value: ReactNode; label: string }[];
  since: string;
  posts: PostSummary[];
};

/** A project with where it links (worked out on the server: components/looks/server.ts withHrefs). */
export type LookProject = ProjectCard & { href: string };

export const projectHref = (project: LookProject) => project.href;

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' });
