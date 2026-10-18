import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bug, FolderKanban, Home, User } from 'lucide-react';
import { getContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Page not found — Boda Madhukar Reddy',
};

const ways = [
  { href: '/', label: 'Home & blog', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/about', label: 'About me', icon: User },
];

/** Every unknown URL, and every notFound() from a page (a missing post, topic or case study). */
export default async function NotFound() {
  const { posts } = await getContent();
  const latest = posts.slice(0, 3);

  return (
    <div className="container mx-auto max-w-3xl px-4 md:px-6 pt-16 lg:pt-36 pb-16 lg:pb-24">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={96}
          height={96}
          className="h-24 w-24 rounded-full ring-1 ring-foreground/15"
          priority
        />
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">404 · Not found</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          This page took a wrong turn.
        </h1>
        <p className="mt-4 max-w-lg text-base md:text-lg leading-relaxed text-muted-foreground">
          The link may be old, or the page has moved. Here are a few good places to go instead.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {ways.map(({ href, label, icon: Icon }, i) => (
            <Link
              key={href}
              href={href}
              className={
                i === 0
                  ? 'tinted-button !px-5 !py-2.5'
                  : 'glass glass-pill glass-interactive inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground'
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {latest.length > 0 && (
        <section aria-labelledby="latest-heading" className="mt-14 md:mt-16">
          <h2 id="latest-heading" className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Latest writing
          </h2>
          <ul className="glass divide-y divide-foreground/10 p-2">
            {latest.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group flex items-center gap-4 rounded-xl px-3 py-3.5 hover:bg-foreground/5 transition-colors">
                  <span className="flex-1">
                    <span className="block font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">{p.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{p.category} · {p.date}</span>
                  </span>
                  <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Expected something here?{' '}
        <Link href="/fix-a-bug" className="tap inline-flex items-center gap-1 font-semibold text-primary">
          <Bug aria-hidden className="h-3.5 w-3.5" /> Tell me about it
        </Link>
      </p>
    </div>
  );
}
