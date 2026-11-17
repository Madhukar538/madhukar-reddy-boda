import { siteHost } from '@/lib/site-content';

/** A site's uploaded images on its own domain (/media/{hash}.{ext}), from its own database. */
export const runtime = 'nodejs';

const FILE = /^[a-f0-9]{32}\.(webp|png|jpg|gif)$/;

export async function GET(_request: Request, { params }: { params: Promise<{ site: string; file: string }> }) {
  const { site, file } = await params;
  const host = siteHost(site);
  const api = (process.env.API_URL || '').replace(/\/$/, '');
  if (!host || !api || !FILE.test(file)) return new Response('Not found', { status: 404 });
  let upstream: Response;
  try {
    // Not the data cache: its key wouldn't tell two sites' identically named images apart.
    upstream = await fetch(`${api}/media/${file}`, { headers: { 'X-Tenant-Host': host }, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  } catch {
    return new Response('Image unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!upstream.ok) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
