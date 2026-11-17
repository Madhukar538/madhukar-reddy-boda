import { notFound } from 'next/navigation';

/**
 * Any path this site has no page for. With more than one root layout there is no app-wide 404
 * page, so unknown paths land here and get this site's own 404 (not-found.tsx), with its nav.
 * Other sites' paths (/sites/<domain>/...) match their own, more specific catch-all instead.
 */
export default function Missing() {
  notFound();
}
