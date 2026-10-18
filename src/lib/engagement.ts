/**
 * Browser-side client for post engagement on the .NET API: reads, reactions,
 * comments and the most-read list. One request per post feeds every widget on
 * the page (read count, reactions, comments): it is shared, not repeated.
 * No cookies are sent; when NEXT_PUBLIC_API_URL isn't set, nothing loads.
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export const engagementEnabled = API_URL.length > 0;

export const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'idea', emoji: '💡', label: 'Insightful' },
  { key: 'fire', emoji: '🔥', label: 'Impressive' },
  { key: 'love', emoji: '❤️', label: 'Love it' },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]['key'];

export type PublicComment = { id: string; name: string; body: string; createdAt: string };

export type Engagement = {
  slug: string;
  reads: number;
  reactions: Record<ReactionKey, number>;
  comments: PublicComment[];
};

export type PopularPost = { slug: string; title: string; reads: number; reactions: number };

type ApiResponse<T> = { returnCode: number; returnMessage: string; data: T };

export class EngagementError extends Error {}

async function call<T>(action: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}/api/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'omit',
  });
  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !json || json.returnCode !== 1) {
    throw new EngagementError(json?.returnMessage || 'Something went wrong. Please try again.');
  }
  return json.data;
}

const loaded = new Map<string, Promise<Engagement>>();

/** The post's engagement, fetched once per page load and shared by every widget. */
export function loadEngagement(slug: string, fresh = false): Promise<Engagement> {
  if (fresh || !loaded.has(slug)) {
    const request = call<Engagement>('GetPostEngagement', { slug });
    loaded.set(slug, request);
    request.catch(() => loaded.delete(slug));
  }
  return loaded.get(slug)!;
}

export const react = (slug: string, reaction: ReactionKey, isAdded: boolean) =>
  call<null>('ReactToPost', { slug, reaction, isAdded });

export const addComment = (input: { slug: string; name: string; body: string; website: string; elapsedMs: number }) =>
  call<null>('AddComment', input);

let popular: Promise<PopularPost[]> | null = null;

export function loadPopular(): Promise<PopularPost[]> {
  if (!popular) {
    popular = call<PopularPost[]>('GetPopularPosts', { limit: 6 });
    popular.catch(() => (popular = null));
  }
  return popular;
}

/** 1234 → "1.2k". */
export const compactNumber = (value: number) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

/** The reactions this browser has given a post (kept only in this browser). */
export function myReactions(slug: string): ReactionKey[] {
  try {
    return JSON.parse(localStorage.getItem(`reactions:${slug}`) || '[]');
  } catch {
    return [];
  }
}

export function saveMyReactions(slug: string, keys: ReactionKey[]) {
  try {
    localStorage.setItem(`reactions:${slug}`, JSON.stringify(keys));
  } catch {
    // Private mode: the reaction still counts, it just isn't remembered.
  }
}
