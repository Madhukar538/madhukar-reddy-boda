import { createHmac, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { CONTENT_TAGS } from '@/lib/content';

// Refreshes cached content the moment it changes. Two callers, each proving who it is:
// - the API, after a save: X-Signature is sha256=HMAC(REVALIDATE_SECRET, "{X-Timestamp}.{body}")
// - the admin pages, as a fallback when that call didn't get through: the admin's
//   access token, which is checked with the API (so only a live admin session works).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_AGE_SECONDS = 5 * 60;
const MAX_BODY_BYTES = 4096;
const TAG = new RegExp(`^(${CONTENT_TAGS.join('|')}|post:[a-z0-9-]{1,128})$`);
const BEARER = /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/;

const reply = (status: number, message: string) => Response.json({ message }, { status });

function isSigned(secret: string, timestamp: string, body: string, signature: string) {
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`);
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function isFresh(timestamp: string) {
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  return /^\d{1,12}$/.test(timestamp) && age <= MAX_AGE_SECONDS;
}

/** True only if the API accepts the token as a current admin session. */
async function isAdmin(authorization: string) {
  const api = (process.env.API_URL || '').replace(/\/$/, '');
  if (!api) return false;
  try {
    const response = await fetch(`${api}/api/GetCurrentAdmin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok && ((await response.json()) as { returnCode?: number }).returnCode === 1;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) return reply(413, 'Body too large.');

  const authorization = request.headers.get('authorization') ?? '';
  if (authorization) {
    if (!BEARER.test(authorization) || !(await isAdmin(authorization))) return reply(401, 'Not signed in.');
  } else {
    const secret = process.env.REVALIDATE_SECRET ?? '';
    if (secret.length < 32) return reply(404, 'Not found.');
    const timestamp = request.headers.get('x-timestamp') ?? '';
    if (!isFresh(timestamp)) return reply(401, 'Stale or missing timestamp.');
    if (!isSigned(secret, timestamp, body, request.headers.get('x-signature') ?? '')) return reply(401, 'Bad signature.');
  }

  let tags: unknown;
  try {
    tags = (JSON.parse(body) as { tags?: unknown }).tags;
  } catch {
    return reply(400, 'Body must be JSON.');
  }
  if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string' && TAG.test(t))) return reply(400, 'Unknown tags.');

  const unique = [...new Set(tags as string[])];
  for (const tag of unique) revalidateTag(tag);
  return Response.json({ revalidated: unique });
}
