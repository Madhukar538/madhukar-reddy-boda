import Link from 'next/link';

/** A page this site doesn't have, or a domain that isn't set up yet. */
export default function SiteNotFound() {
  return (
    <div className="container mx-auto max-w-3xl px-4 md:px-6 pt-24 pb-24">
      <p className="ed-404-kicker">( Not found )</p>
      <h1 className="mt-4 text-[clamp(2.5rem,7vw,4rem)] leading-[1.02]">Nothing here.</h1>
      <p className="mt-4 text-muted-foreground">The page doesn&apos;t exist, or this site isn&apos;t set up yet.</p>
      <Link href="/" className="ed-link mt-8 inline-flex">
        Go to the start
      </Link>
    </div>
  );
}
