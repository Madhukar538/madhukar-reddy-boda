import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { nowDate } from '@/lib/utils';

/**
 * "Now": the current focus and the latest post, as a compact strip that closes
 * the hero (under the metrics). Two columns from sm up, stacked on phones.
 */
export function NowCard({ now, updatedAt, latest }: { now: string; updatedAt: string | null; latest?: { slug: string; title: string } }) {
  const updated = nowDate(updatedAt);
  return (
    <aside aria-labelledby="now-heading" className="now-card glass px-4 py-3.5 sm:px-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
        <div className="min-w-0">
          <p id="now-heading" className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span aria-hidden className="now-pulse" />
            Now
            {updated && <span className="font-normal normal-case tracking-normal">· updated {updated}</span>}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{now}</p>
        </div>
        {latest && (
          <Link
            href={`/blog/${latest.slug}`}
            className="group block border-t border-foreground/10 pt-3 sm:max-w-[16rem] sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"
          >
            <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Latest post</span>
            <span className="mt-1 flex items-start gap-1 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
              {latest.title}
              <ArrowUpRight aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
