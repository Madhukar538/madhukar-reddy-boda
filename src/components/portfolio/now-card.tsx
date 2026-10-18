import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { now } from '@/data/now';

/**
 * "Now": the current focus and the latest post, in the empty space left of
 * the hero. Only on very wide screens, where that space exists (.now-card in
 * globals.css); elsewhere the bento below already says what Madhukar does.
 */
export function NowCard({ latest }: { latest?: { slug: string; title: string } }) {
  return (
    <aside aria-labelledby="now-heading" className="now-card glass p-4">
      <p id="now-heading" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span aria-hidden className="now-pulse" />
        Now
      </p>
      <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">{now.focus}</p>
      {latest && (
        <Link href={`/blog/${latest.slug}`} className="group mt-3.5 block border-t border-foreground/10 pt-3">
          <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Latest post</span>
          <span className="mt-1 flex items-start gap-1 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            {latest.title}
            <ArrowUpRight aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          </span>
        </Link>
      )}
      <p className="mt-3 text-[0.7rem] text-muted-foreground">Updated {now.updated}</p>
    </aside>
  );
}
