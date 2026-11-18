import type { Metadata } from 'next';

/**
 * The page's Open Graph block with its own og:url (link previews use it as the shared page's
 * address). A page-level openGraph replaces the layout's, so the site-wide fields are repeated here,
 * the site's card image (/og, the same card as the homepage's) included: without it, pages lose the
 * image they used to inherit. The title and description still come from the page.
 */
export const pageOpenGraph = (url: string, type: 'website' | 'article' = 'website'): NonNullable<Metadata['openGraph']> => ({
  type,
  url,
  siteName: 'Boda Madhukar Reddy',
  locale: 'en_IN',
  images: [{ url: '/og', width: 1200, height: 630, type: 'image/jpeg' }],
});
