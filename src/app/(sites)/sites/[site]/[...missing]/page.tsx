import { notFound } from 'next/navigation';

/** Any path a site doesn't have: its own 404, in its own layout (never this site's). */
export default function SiteMissing() {
  notFound();
}
