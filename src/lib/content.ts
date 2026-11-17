import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { blogs, readTime, type BlogPost } from '@/data/blogs';
import * as builtIn from '@/data/profile';
import type { ClientProject, Experiment, ProjectCard, SkillCategory, Status } from '@/data/profile';
import type { DesignStyle } from '@/lib/design-style';
import { BUILT_IN_STORY, parseStory, type Story } from '@/lib/story';

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
export type SocialLink = { network: 'GitHub' | 'LinkedIn'; href: string };

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
  /** The Editorial homepage's story (lib/story.ts). */
  story: Story;
};

/** Content tags the API revalidates; post:<slug> tags are accepted too. */
export const CONTENT_TAGS = ['posts', 'projects', 'profile', 'themes', 'story'] as const;

export const byNewest = (list: BlogPost[]) => [...list].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

const socialLinksOf = (profile: Profile): SocialLink[] =>
  (
    [
      { network: 'GitHub', href: profile.github },
      { network: 'LinkedIn', href: profile.linkedin },
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
  story: BUILT_IN_STORY,
};

// ---- API ----------------------------------------------------------------

export type ApiPost = { id: string; title: string; excerpt: string; content: string; date: string; category: string; tags: string[] };
export type ApiProject = {
  id: string; kind: 'key' | 'client' | 'lab'; title: string; description: string; tech: string[]; post: string;
  isFeatured: boolean; outcome: string; status: string; client: string; role: string; duration: string; url: string; responsibilities: string[];
};
type ApiThemes = { defaultTheme: string; themes: { id: string; isEnabled: boolean }[] };
export type ApiProfile = Omit<Profile, 'nowUpdatedAt'> & { nowUpdatedAt?: string | null; skillCategories: SkillCategory[]; experience: Experience; education: Education };

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
// The stored story as JSON ("" until one is saved): validated here, so a bad save can't break the page.
const loadStory = unstable_cache(() => callApi<{ json: string }>('GetStory'), ['api', 'story'], { tags: ['story'], revalidate: SAFETY_REFRESH_SECONDS });
const loadThemes = unstable_cache(() => callApi<ApiThemes>('GetThemes'), ['api', 'themes'], { tags: ['themes'], revalidate: SAFETY_REFRESH_SECONDS });

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

export const toPost = (p: ApiPost): BlogPost => ({
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

export function toProjects(list: ApiProject[]) {
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

export function toProfile(p: ApiProfile) {
  const profile: Profile = {
    name: p.name, title: p.title, company: p.company, location: p.location, email: p.email, phone: p.phone,
    phoneHref: p.phoneHref, github: p.github, linkedin: p.linkedin ?? '', twitter: p.twitter ?? '', summary: p.summary,
    // Until a Now note is saved in the admin, the built-in one stands in.
    ...(p.now ? { now: p.now, nowUpdatedAt: p.nowUpdatedAt ?? null } : { now: builtIn.profile.now, nowUpdatedAt: builtIn.profile.nowUpdatedAt }),
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
  const [posts, projects, profile, story] = await Promise.all([
    attempt('posts', loadPosts),
    attempt('projects', loadProjects),
    attempt('profile', loadProfile),
    attempt('story', loadStory),
  ]);
  return {
    ...BUILT_IN_CONTENT,
    ...(posts ? { posts: byNewest(posts.map(toPost)) } : {}),
    ...(projects ? toProjects(projects) : {}),
    ...(profile ? toProfile(profile) : {}),
    story: parseStory(story?.json) ?? BUILT_IN_STORY,
  };
});

/** Themes the site has styles for (components/look-toggle.tsx lists how each looks in the picker). */
export const KNOWN_THEMES: DesignStyle[] = ['terminal', 'midnight', 'blueprint', 'editorial', 'glass', 'arctic', 'synthwave', 'dune', 'gazette', 'receipt', 'observatory', 'bazaar'];

/** Which themes visitors can pick and which one the site opens in, set in the admin (Themes). */
export type ThemeSettings = { defaultTheme: DesignStyle; enabled: DesignStyle[] };

/** Without the API, or until it answers: every theme, opening in Terminal. */
const BUILT_IN_THEMES: ThemeSettings = { defaultTheme: 'terminal', enabled: KNOWN_THEMES };

export const getThemeSettings = cache(async (): Promise<ThemeSettings> => {
  if (!apiBase()) return BUILT_IN_THEMES;
  const api = await attempt('themes', loadThemes);
  const enabled = KNOWN_THEMES.filter((id) => api?.themes.some((t) => t.id === id && t.isEnabled));
  if (!api || enabled.length === 0) return BUILT_IN_THEMES;
  const defaultTheme = enabled.find((id) => id === api.defaultTheme) ?? enabled[0];
  return { defaultTheme, enabled };
});
