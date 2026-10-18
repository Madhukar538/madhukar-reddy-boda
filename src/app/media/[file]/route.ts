// Uploaded post images, served from this site's own origin (/media/{hash}.{ext}),
// so post HTML needs no extra CSP source and Cloudflare caches them at the edge.
// Each image is fetched from the API once and kept in Next's data cache; a name
// is a hash of the content, so it never changes and is cached as immutable.
export const runtime = 'nodejs';

const FILE = /^[a-f0-9]{32}\.(webp|png|jpg|gif)$/;

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const api = (process.env.API_URL || '').replace(/\/$/, '');
  if (!api || !FILE.test(file)) return new Response('Not found', { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(`${api}/media/${file}`, { cache: 'force-cache', signal: AbortSignal.timeout(10_000) });
  } catch {
    return new Response('Image unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!upstream.ok) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: upstream.headers.get('etag') ?? `"${file.split('.')[0]}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
