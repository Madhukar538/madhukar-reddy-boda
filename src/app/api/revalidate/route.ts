import { createHmac, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { CONTENT_TAGS } from '@/lib/content';

// Called by the API after content changes, so edits appear within seconds.
// The request is signed: X-Signature is sha256=HMAC(REVALIDATE_SECRET, "{X-Timestamp}.{body}").
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_AGE_SECONDS = 5 * 60;
const MAX_BODY_BYTES = 4096;
const TAG = new RegExp(`^(${CONTENT_TAGS.join('|')}|post:[a-z0-9-]{1,128})$`);

const reply = (status: number, message: string) => Response.json({ message }, { status });

function isSigned(secret: string, timestamp: string, body: string, signature: string) {
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`);
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET ?? '';
  if (secret.length < 32) return reply(404, 'Not found.');

  const timestamp = request.headers.get('x-timestamp') ?? '';
  const signature = request.headers.get('x-signature') ?? '';
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!/^\d{1,12}$/.test(timestamp) || !(age <= MAX_AGE_SECONDS)) return reply(401, 'Stale or missing timestamp.');

  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) return reply(413, 'Body too large.');
  if (!isSigned(secret, timestamp, body, signature)) return reply(401, 'Bad signature.');

  let tags: unknown;
  try {
    tags = (JSON.parse(body) as { tags?: unknown }).tags;
  } catch {
    return reply(400, 'Body must be JSON.');
  }
  if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string' && TAG.test(t))) return reply(400, 'Unknown tags.');

  for (const tag of new Set(tags as string[])) revalidateTag(tag);
  return Response.json({ revalidated: [...new Set(tags)] });
}
