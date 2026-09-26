import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { posts } from '@/lib/blog';
import { BlogMarquee } from './blog-marquee';

/** "From the blog" section: every post in a draggable marquee, newest first. */
export function BlogStrip({ className }: { className?: string }) {
  const items = posts.map(({ slug, title, excerpt, date, readTime, category }) => ({ slug, title, excerpt, date, readTime, category }));
  return (
    <section aria-labelledby="blog-strip-heading" className={className}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">From the blog</p>
          <h2 id="blog-strip-heading" className="text-2xl md:text-3xl font-bold tracking-tight">
            Drag through the writing
          </h2>
        </div>
        <Link href="/" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
          All posts <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <BlogMarquee posts={items} />
    </section>
  );
}
