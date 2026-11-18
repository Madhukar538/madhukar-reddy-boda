import { CHUNK_ERROR } from '@/lib/chunk-reload';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

/** At most this many reports per page load, each kind of error once: a loop that throws can't flood the API. */
const MAX_PER_LOAD = 5;
const sent = new Set<string>();

/** Errors that say nothing actionable: no detail from another origin, browser noise, a stale build (it reloads itself). */
const IGNORED = /^(Script error\.?|ResizeObserver loop|Non-Error promise rejection captured)|AbortError|The user aborted a request/i;
const EXTENSION = /(chrome|moz|safari(-web)?|ms-browser)-extension:\/\//i;

/**
 * Sends one script error to the API for Admin → Errors: the message, where it was thrown, the
 * page path and the look. No cookies or ids; the API also masks emails, numbers and query strings.
 * Skipped on admin pages, without NEXT_PUBLIC_API_URL, for browser extensions and in development.
 */
export function reportError(error: unknown, where: { source?: string; line?: number; column?: number } = {}) {
  if (!API_URL || process.env.NODE_ENV !== 'production' || typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return;

  const err = error instanceof Error ? error : null;
  const message = (err ? `${err.name}: ${err.message}` : String(error ?? '')).slice(0, 300);
  const stack = (err?.stack ?? '').slice(0, 4000);
  if (!message || IGNORED.test(message) || IGNORED.test(err?.message ?? '') || CHUNK_ERROR.test(message)) return;
  if (EXTENSION.test(where.source ?? '') || EXTENSION.test(stack)) return;

  const key = `${message}|${where.source ?? ''}|${where.line ?? 0}`;
  if (sent.has(key) || sent.size >= MAX_PER_LOAD) return;
  sent.add(key);

  fetch(`${API_URL}/api/ReportClientError`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      source: where.source ?? '',
      line: where.line ?? 0,
      column: where.column ?? 0,
      stack,
      page: path,
      look: document.documentElement.dataset.style ?? '',
    }),
    credentials: 'omit',
    keepalive: true,
  }).catch(() => {});
}
