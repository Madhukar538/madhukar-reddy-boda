import { NextResponse, type NextRequest } from 'next/server';

/**
 * Serves other sites on the platform from this app, each on its own domain: a request for
 * asha.example.com/about is rewritten to /sites/asha.example.com/about (app/(sites)), whose pages
 * load that site's content from the API by domain. Requests for this site's own hosts pass through
 * untouched.
 *
 * Off unless SITES_ENABLED=true, so a misconfigured host list can't take dhucar.in down. Either way,
 * /sites/... can't be opened directly (only through a site's own domain), and only the Host header is
 * trusted for the domain (never X-Forwarded-Host, which a client can set and a cache would ignore).
 */

const PRIMARY_HOSTS = (process.env.PRIMARY_HOSTS || 'dhucar.in,www.dhucar.in,localhost,127.0.0.1')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/sites' || pathname.startsWith('/sites/')) {
    return new NextResponse('Not found', { status: 404 });
  }
  if (process.env.SITES_ENABLED !== 'true') return NextResponse.next();

  const host = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();
  if (!host || PRIMARY_HOSTS.includes(host)) return NextResponse.next();

  // Another site's domain: every path is one of its own pages (this site's API routes, admin, MCP
  // endpoint and files are never served there).
  const url = request.nextUrl.clone();
  url.pathname = `/sites/${host}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Everything except Next's own assets and static files (fonts, images, scripts, styles). Not .txt/.xml:
  // robots.txt, sitemap.xml, rss.xml and llms.txt are this site's own, never another domain's.
  matcher: ['/((?!_next/|favicon\\.ico|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|css|js|map)$).*)'],
};
