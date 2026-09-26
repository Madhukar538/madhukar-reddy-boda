import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { blogs, readTime, type BlogPost } from '@/data/blogs';
import * as builtIn from '@/data/profile';
import type { ClientProject, Experiment, ProjectCard, SkillCategory, Status } from '@/data/profile';

/**
 * Where the site's content comes from. With API_URL set, posts, projects and
 * the profile are read from the .NET API through Next's data cache, tagged so
 * the API's signed webhook (app/api/revalidate) refreshes exactly what changed.
 * Without it, or whenever the API can't be reached, the built-in content in
 * src/data is used, so the site never breaks because of the API.
 * Server-side only.
 */

export type Profile = typeof builtIn.profile;
export type Experience = typeof builtIn.experience;
export type Education = typeof builtIn.education;
export type SocialLink = { network: 'GitHub' | 'LinkedIn' | 'Twitter'; href: string };

export type SiteContent = {
  /** Newest first. */
  posts: BlogPost[];
  profile: Profile;
  socialLinks: SocialLink[];
  skillCategories: SkillCategory[];
  experience: Experience;
  education: Education;
  keyProjects: ProjectCard[];
  clientProjects: ClientProject[];
  rdProjects: Experiment[];
};

/** Content tags the API revalidates; post:<slug> tags are accepted too. */
export const CONTENT_TAGS = ['posts', 'projects', 'profile'] as const;

const byNewest = (list: BlogPost[]) => [...list].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

const socialLinksOf = (profile: Profile): SocialLink[] =>
  (
    [
      { network: 'GitHub', href: profile.github },
      { network: 'LinkedIn', href: profile.linkedin },
      { network: 'Twitter', href: profile.twitter },
    ] as SocialLink[]
  ).filter((link) => link.href);

export const BUILT_IN_CONTENT: SiteContent = {
  posts: byNewest(blogs),
  profile: builtIn.profile,
  socialLinks: socialLinksOf(builtIn.profile),
  skillCategories: builtIn.skillCategories,
  experience: builtIn.experience,
  education: builtIn.education,
  keyProjects: builtIn.keyProjects,
  clientProjects: builtIn.clientProjects,
  rdProjects: builtIn.rdProjects,
};

// ---- API ----------------------------------------------------------------

type ApiPost = { id: string; title: string; excerpt: string; content: string; date: string; category: string; tags: string[] };
type ApiProject = {
  id: string; kind: 'key' | 'client' | 'lab'; title: string; description: string; tech: string[]; post: string;
  isFeatured: boolean; outcome: string; status: string; client: string; role: string; duration: string; url: string; responsibilities: string[];
};
type ApiProfile = Profile & { skillCategories: SkillCategory[]; experience: Experience; education: Education };

const apiBase = () => (process.env.API_URL || '').replace(/\/$/, '');

async function callApi<T>(action: string): Promise<T> {
  const response = await fetch(`${apiBase()}/api/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  const json = (await response.json()) as { returnCode: number; returnMessage: string; data: T };
  if (!response.ok || json.returnCode !== 1) throw new Error(`${action}: ${response.status} ${json.returnMessage}`);
  return json.data;
}

// Cached per tag; a failed call throws, so a fallback is never cached. Saves refresh
// the cache at once (app/api/revalidate); the 5-minute expiry is only a safety net.
const SAFETY_REFRESH_SECONDS = 300;
const loadPosts = unstable_cache(() => callApi<ApiPost[]>('GetPosts'), ['api', 'posts'], { tags: ['posts'], revalidate: SAFETY_REFRESH_SECONDS });
const loadProjects = unstable_cache(() => callApi<ApiProject[]>('GetProjects'), ['api', 'projects'], { tags: ['projects'], revalidate: SAFETY_REFRESH_SECONDS });
const loadProfile = unstable_cache(() => callApi<ApiProfile>('GetProfile'), ['api', 'profile'], { tags: ['profile'], revalidate: SAFETY_REFRESH_SECONDS });

// Warn once per section until it recovers, not once per page.
const failing = new Set<string>();

async function attempt<T>(label: string, load: () => Promise<T>): Promise<T | null> {
  try {
    const result = await load();
    failing.delete(label);
    return result;
  } catch (error) {
    if (!failing.has(label)) console.warn(`[content] ${label} unavailable, using built-in content:`, (error as Error).message);
    failing.add(label);
    return null;
  }
}

const toPost = (p: ApiPost): BlogPost => ({
  slug: p.id,
  title: p.title,
  excerpt: p.excerpt,
  content: p.content,
  date: p.date,
  readTime: readTime(p.content),
  category: p.category,
  tags: p.tags ?? [],
});

const optional = (value: string) => (value ? value : undefined);

function toProjects(list: ApiProject[]) {
  return {
    keyProjects: list.filter((p) => p.kind === 'key').map((p): ProjectCard => ({
      title: p.title, description: p.description, tech: p.tech ?? [], post: optional(p.post), featured: p.isFeatured || undefined, outcome: optional(p.outcome),
    })),
    clientProjects: list.filter((p) => p.kind === 'client').map((p): ClientProject => ({
      id: p.id, title: p.title, client: p.client, role: p.role, duration: p.duration, url: optional(p.url),
      description: p.description, responsibilities: p.responsibilities ?? [], tech: p.tech ?? [],
    })),
    rdProjects: list.filter((p) => p.kind === 'lab').map((p): Experiment => ({
      title: p.title, description: p.description, tech: p.tech ?? [], status: p.status as Status, post: optional(p.post),
    })),
  };
}

const SKILL_COLORS = ['green', 'cyan', 'amber'];

function toProfile(p: ApiProfile) {
  const profile: Profile = {
    name: p.name, title: p.title, company: p.company, location: p.location, email: p.email, phone: p.phone,
    phoneHref: p.phoneHref, github: p.github, linkedin: p.linkedin ?? '', twitter: p.twitter ?? '', summary: p.summary,
  };
  // Only colours the site has styles for; anything else falls back to the default.
  const skillCategories = p.skillCategories.map(({ title, skills, color }) => ({
    title,
    skills,
    color: SKILL_COLORS.includes(color as never) ? (color as SkillCategory['color']) : undefined,
  }));
  return { profile, socialLinks: socialLinksOf(profile), skillCategories, experience: p.experience, education: p.education };
}

/** All site content for this request (deduplicated per render). */
export const getContent = cache(async (): Promise<SiteContent> => {
  if (!apiBase()) return BUILT_IN_CONTENT;
  const [posts, projects, profile] = await Promise.all([
    attempt('posts', loadPosts),
    attempt('projects', loadProjects),
    attempt('profile', loadProfile),
  ]);
  return {
    ...BUILT_IN_CONTENT,
    ...(posts ? { posts: byNewest(posts.map(toPost)) } : {}),
    ...(projects ? toProjects(projects) : {}),
    ...(profile ? toProfile(profile) : {}),
  };
});
