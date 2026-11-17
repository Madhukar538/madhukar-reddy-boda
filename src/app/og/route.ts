import { default as Image } from '../(main)/opengraph-image';

/**
 * The homepage's share image at a stable address (/og). Next serves the file-based image under a
 * hashed name because the page sits in a route group; this is the address to use in structured data,
 * and the target of the old /opengraph-image URL (next.config.ts redirects).
 */
export const dynamic = 'force-static';

export function GET() {
  return Image();
}
