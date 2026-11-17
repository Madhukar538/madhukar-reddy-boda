import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { byNewest, toPost, toProfile, toProjects, type ApiPost, type ApiProfile, type ApiProject, type SiteContent } from '@/lib/content';
import { parseStory, type Story } from '@/lib/story';

/**
 * Content for another site on the platform, served on its own domain (app/(sites)). Everything comes
 * from that site's own data in the API, named by its domain (X-Tenant-Host). Unlike getContent(), there
 * is no built-in fallback: this site's own content must never appear on someone else's domain, so a
 * site the API doesn't know, or that has no profile yet, is simply not found. Server-side only.
 */

const apiBase = () => (process.env.API_URL || '').replace(/\/$/, '');

/** Other sites have no revalidation webhook yet: their pages refresh within a minute. */
const REFRESH_SECONDS = 60;

/** A host name as the API expects it (lower case, no port), or null if it isn't one. */
export function siteHost(value: string): string | null {
  const host = decodeURIComponent(value).trim().toLowerCase();
  return /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ? host : null;
}

async function callSiteApi<T>(host: string, action: string): Promise<T> {
  const response = await fetch(`${apiBase()}/api/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-Host': host },
    body: '{}',
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  const json = (await response.json()) as { returnCode: number; returnMessage: string; data: T };
  if (!response.ok || json.returnCode !== 1) throw new Error(`${action} for ${host}: ${response.status} ${json.returnMessage}`);
  return json.data;
}

const load = <T,>(host: string, action: string) =>
  unstable_cache(() => callSiteApi<T>(host, action), ['site', host, action], { tags: [`site:${host}`], revalidate: REFRESH_SECONDS })();

/** A plain story from the profile, for a site that hasn't written its own yet. */
export function defaultStory(profile: SiteContent['profile']): Story {
  const words = profile.name.split(/\s+/).filter(Boolean);
  return {
    hero: {
      heading: `${profile.name}: ${profile.title}`,
      meta: [profile.title.slice(0, 60) || 'Portfolio'],
      nameLines: (words.length > 0 ? words : ['Portfolio']).slice(0, 3).map((w) => w.slice(0, 14)),
      index: [
        ...(profile.title ? [{ label: 'Role', value: profile.title.slice(0, 60) }] : []),
        ...(profile.location ? [{ label: 'Based', value: profile.location.slice(0, 60) }] : []),
      ],
      badge: `${profile.name.toUpperCase()} ✶ ${profile.title.toUpperCase()} ✶`.slice(0, 60),
      showAgentMap: false,
      lede: profile.title || profile.name,
      body: profile.summary || profile.title || profile.name,
    },
    ticker: [],
    story: { kicker: 'The journey so far', headline: profile.title || 'The journey so far', chapters: [] },
  };
}

/** The site's content, or null when its domain isn't a site, the API can't be reached, or it has no profile yet. */
export const getSiteContent = cache(async (rawHost: string): Promise<SiteContent | null> => {
  const host = siteHost(rawHost);
  if (!host || !apiBase()) return null;
  try {
    const [profileData, posts, projects, story] = await Promise.all([
      load<ApiProfile>(host, 'GetProfile'),
      load<ApiPost[]>(host, 'GetPosts').catch(() => [] as ApiPost[]),
      load<ApiProject[]>(host, 'GetProjects').catch(() => [] as ApiProject[]),
      load<{ json: string }>(host, 'GetStory').catch(() => ({ json: '' })),
    ]);
    const mapped = toProfile(profileData);
    // Never this site's own Now note in someone else's profile.
    const profile = profileData.now ? mapped.profile : { ...mapped.profile, now: '', nowUpdatedAt: null };
    return {
      posts: byNewest(posts.map(toPost)),
      ...mapped,
      profile,
      ...toProjects(projects),
      story: parseStory(story.json) ?? defaultStory(profile),
    };
  } catch {
    return null;
  }
});
