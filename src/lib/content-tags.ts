/**
 * The cache tags the site's content is stored under (lib/content.ts). The API refreshes them after
 * a save through app/api/revalidate, and the admin's "Refresh the site" button refreshes them all.
 * Kept apart from lib/content.ts, which is server-only, so the admin pages can import it.
 */
export const CONTENT_TAGS = ['posts', 'projects', 'profile', 'themes', 'story', 'bugLog', 'pages'] as const;

/** A tag the revalidate endpoint accepts: one of the above, or one post or page by its slug. */
export const TAG_PATTERN = new RegExp(`^(${CONTENT_TAGS.join('|')}|post:[a-z0-9-]{1,128}|page:[a-z0-9-]{1,64})$`);
