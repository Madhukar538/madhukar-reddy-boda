import type { ProjectCard } from '@/data/profile';
import { caseStudyFor } from '@/data/case-studies';
import type { LookProject } from './types';

/** Each project with its link: its case study, else its write-up, else the Projects page. */
export function withHrefs(projects: ProjectCard[]): LookProject[] {
  return projects.map((p) => {
    const study = caseStudyFor(p.title);
    return { ...p, href: study ? `/projects/${study.slug}` : p.post ? `/blog/${p.post}` : '/projects' };
  });
}
