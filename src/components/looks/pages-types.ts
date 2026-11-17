import type { ClientProject } from '@/data/profile';
import type { LookProject } from './types';
import type { Experience } from '@/lib/content';
import type { Story } from '@/lib/story';

/**
 * What the inner pages of Arctic, Synthwave and Dune are built from. Like Editorial's, each block is
 * in the page for every look and shown only in its own (globals.css .look-only); the classic blocks
 * (.classic-only) are hidden there.
 */
export type ExperienceProps = { experience: Experience; clientProjects: ClientProject[]; journey: Story['journey'] };
export type AboutProps = { name: string; values: Record<string, string>; about: Story['about'] };
export type ProjectsProps = { keyProjects: LookProject[]; clientProjects: ClientProject[] };

/** The act's headline for a group of experience, from the story (falls back to the group's own label). */
export const actTitle = (journey: Story['journey'], group: string) => journey?.acts.find((a) => a.group === group)?.title ?? group;
