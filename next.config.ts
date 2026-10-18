import type {NextConfig} from 'next';

// Unique per deployment. The service worker is registered as /sw.js?v=<id>,
// so each deploy installs a fresh worker and cache (see public/sw.js).
// Coolify exposes the commit as SOURCE_COMMIT; fall back to the build time.
const buildId =
  process.env.SOURCE_COMMIT ||
  process.env.GIT_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  Date.now().toString(36);

const isDev = process.env.NODE_ENV !== 'production';
// The admin and the page-view beacon call the API on its own origin.
const apiOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : '';
  } catch {
    return '';
  }
})();

/**
 * Content-Security-Policy. Everything is served from this origin (fonts are
 * self-hosted, images local), so only the API and Cloudflare's optional
 * analytics beacon are allowed beyond 'self'. Scripts need 'unsafe-inline':
 * the pages are static, so per-request nonces aren't possible, and Next.js
 * inlines its hydration data. Injected markup still can't load scripts from
 * anywhere else, post HTML is sanitised by the API, and no data can be sent to
 * another origin (connect-src), framed in (frame-src) or submitted away (form-action).
 */
function csp({ frameAncestors = "'self'" } = {}) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin} https://cloudflareinsights.com${isDev ? ' ws:' : ''}`.replace(/\s+/g, ' '),
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: csp() },
  // Two years, all subdomains (api.dhucar.in included). Only honoured over HTTPS.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Legacy twin of frame-ancestors for old browsers.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Passkeys (publickey-credentials-*) stay allowed for this origin; everything else is off.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
];

const nextConfig: NextConfig = {
  generateBuildId: async () => buildId,
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  // No "X-Powered-By: Next.js" (don't advertise the stack).
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Every response. Checked at securityheaders.com / observatory.mozilla.org level.
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        // The admin can't be framed at all (clickjacking) and leaks no referrer.
        source: '/admin/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: csp({ frameAncestors: "'none'" }) },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        // Never let the HTTP cache serve an old service worker.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // AVIF first: far smaller than WebP for the cut-out portrait (it has transparency).
    formats: ['image/avif', 'image/webp'],
    // Local images only: the optimizer never fetches from other hosts.
    remotePatterns: [],
  },
};

export default nextConfig;
