import type { ReactNode } from 'react';
import type { ProjectCard } from '@/data/profile';
import { caseStudyFor } from '@/data/case-studies';
import type { PostSummary } from '@/lib/blog';

/**
 * What every look's own homepage (Arctic, Synthwave, Dune) is built from. Like Editorial's, each one
 * is in the page for every look and shown only in its own (globals.css), so switching needs no request.
 */
export type LookHomeProps = {
  /** One sentence for screen readers: the page's heading in this look. */
  heading: string;
  name: string;
  projects: ProjectCard[];
  metrics: { value: ReactNode; label: string }[];
  since: string;
  posts: PostSummary[];
};

/** A project's case study, else its write-up, else the Projects page. */
export function projectHref(project: ProjectCard) {
  const study = caseStudyFor(project.title);
  if (study) return `/projects/${study.slug}`;
  return project.post ? `/blog/${project.post}` : '/projects';
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' });
