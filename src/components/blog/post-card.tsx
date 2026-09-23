import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CardPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
};

/** Glass card for a post; `featured` is the large lead card. */
export function PostCard({ post, featured = false, className }: { post: CardPost; featured?: boolean; className?: string }) {
  return (
    <Link href={`/blog/${post.slug}`} className={cn('group block h-full', className)}>
      <article className={cn('glass glass-interactive flex h-full flex-col overflow-hidden', featured ? 'p-6 md:p-9' : 'p-5 md:p-6')}>
        {featured && (
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl !z-0" />
        )}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {featured && <span className="chip chip-accent">Latest</span>}
          <span className="chip">{post.category}</span>
          <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
          </span>
        </div>
        <h3
          className={cn(
            'font-bold tracking-tight text-foreground leading-snug group-hover:text-primary transition-colors',
            featured ? 'text-2xl md:text-4xl mb-3' : 'text-lg md:text-xl mb-2'
          )}
        >
          {post.title}
        </h3>
        <p className={cn('text-muted-foreground leading-relaxed', featured ? 'text-[15px] md:text-base max-w-3xl mb-6' : 'text-sm mb-5 line-clamp-3')}>
          {post.excerpt}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, featured ? 5 : 3).map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
          <span className={featured ? 'tinted-button !py-1.5 !text-sm' : 'flex items-center gap-1.5 text-sm font-semibold text-primary'}>
            Read
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
