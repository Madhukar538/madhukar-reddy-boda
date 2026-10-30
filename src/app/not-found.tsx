import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bug } from 'lucide-react';
import { getContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Page not found — Boda Madhukar Reddy',
};

const ways = [
  { href: '/', label: 'Home', note: 'Start from the top' },
  { href: '/projects', label: 'Projects', note: 'Systems I have built' },
  { href: '/about', label: 'About', note: 'Who I am and how I work' },
];

/**
 * A request trace that fails at the router, drawn like the backdrop diagram:
 * a red request travels client → api-gateway → router and stops at a 404.
 * SVG + SMIL, no JavaScript; the request is hidden for reduced motion (.trace-404).
 */
function Trace() {
  const route = 'M70 40 H470';
  return (
    <svg viewBox="0 0 560 80" className="trace-404 w-full max-w-xl" aria-hidden>
      <path d={route} className="trace-404-line" />
      {[
        { x: 10, label: 'client' },
        { x: 175, label: 'api-gateway' },
        { x: 340, label: 'router' },
      ].map((n) => (
        <g key={n.label}>
          <rect x={n.x} y={24} width={120} height={32} rx={4} className="trace-404-node" />
          <text x={n.x + 12} y={44} className="trace-404-text">{n.label}</text>
        </g>
      ))}
      <g className="trace-404-fail">
        <rect x={490} y={24} width={60} height={32} rx={4} />
        <text x={506} y={45}>404</text>
      </g>
      <circle r={3.5} className="trace-404-packet">
        <animateMotion dur="2.4s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.7;1" calcMode="linear" path={route} />
      </circle>
    </svg>
  );
}

/** Every unknown URL, and every notFound() from a page (a missing post, topic or case study). */
export default async function NotFound() {
  const { posts } = await getContent();
  const latest = posts.slice(0, 3);

  return (
    <div className="container mx-auto max-w-3xl px-4 md:px-6 pt-16 lg:pt-36 pb-16 lg:pb-24">
      <Trace />

      <p className="mt-10 font-mono text-xs text-primary">404 · route not found</p>
      <h1 className="mt-3 text-[clamp(2.5rem,7vw,4rem)] leading-[1.02] text-foreground">
        This route doesn&apos;t resolve.
      </h1>
      <p className="mt-4 max-w-lg text-base md:text-lg leading-relaxed text-muted-foreground">
        The link may be old, or the page has moved. Here are a few good places to go instead.
      </p>

      <ul className="mt-10 border-t border-foreground/10">
        {ways.map(({ href, label, note }) => (
          <li key={href} className="border-b border-foreground/10">
            <Link href={href} className="group flex items-baseline justify-between gap-4 py-4">
              <span>
                <span className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
                <span className="ml-3 text-sm text-muted-foreground">{note}</span>
              </span>
              <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>

      {latest.length > 0 && (
        <section aria-labelledby="latest-heading" className="mt-14">
          <p id="latest-heading" className="mb-3 font-mono text-xs text-muted-foreground">latest writing</p>
          <ul className="space-y-1">
            {latest.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group flex items-baseline justify-between gap-4 py-2">
                  <span className="font-medium leading-snug text-foreground/90 group-hover:text-primary transition-colors">{p.title}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{p.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 text-sm text-muted-foreground">
        Expected something here?{' '}
        <Link href="/fix-a-bug" className="tap inline-flex items-center gap-1 font-medium text-foreground hover:text-primary">
          <Bug aria-hidden className="h-3.5 w-3.5" /> Tell me about it
        </Link>
      </p>
    </div>
  );
}
