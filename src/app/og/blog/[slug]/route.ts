import { default as Image, generateStaticParams as postParams } from '../../../(main)/blog/[slug]/opengraph-image';

/** A post's share image at a stable address (/og/blog/<slug>), as /og is for the homepage. */
export const dynamic = 'force-static';

export const generateStaticParams = postParams;

export function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return Image({ params });
}
