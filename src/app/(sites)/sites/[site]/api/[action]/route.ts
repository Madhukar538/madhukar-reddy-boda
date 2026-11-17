import { siteHost } from '@/lib/site-content';

/**
 * The API, on another site's own domain: asha.example.com/api/<Action> is passed to the .NET API
 * with X-Tenant-Host, so the site's admin talks to its own origin. Its sign-in cookie is then the
 * site's own first-party cookie (SameSite=Strict on api.dhucar.in would never reach another domain),
 * and the API serves only that site's database. POST only, an action name only, small bodies.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTION = /^[A-Za-z]{2,40}$/;
const MAX_BODY_BYTES = 6 * 1024 * 1024; // image uploads included
const FORWARD = ['content-type', 'authorization', 'x-requested-with', 'cookie', 'cf-connecting-ip', 'user-agent'];

export async function POST(request: Request, { params }: { params: Promise<{ site: string; action: string }> }) {
  const { site, action } = await params;
  const host = siteHost(site);
  const api = (process.env.API_URL || '').replace(/\/$/, '');
  if (!host || !api || !ACTION.test(action)) return Response.json({ returnCode: -5, returnMessage: 'Not found.' }, { status: 404 });
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return Response.json({ returnCode: -1, returnMessage: 'Too large.' }, { status: 413 });

  const headers = new Headers({ 'X-Tenant-Host': host });
  for (const name of FORWARD) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  let upstream: Response;
  try {
    upstream = await fetch(`${api}/api/${action}`, {
      method: 'POST',
      headers,
      body: await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return Response.json({ returnCode: -99, returnMessage: "Can't reach the API." }, { status: 502 });
  }
  const out = new Headers({ 'Cache-Control': 'no-store' });
  const type = upstream.headers.get('content-type');
  if (type) out.set('Content-Type', type);
  // The API's own session cookie for this site (__Host-rt_<slug>), now first-party here.
  for (const cookie of upstream.headers.getSetCookie()) out.append('Set-Cookie', cookie);
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
