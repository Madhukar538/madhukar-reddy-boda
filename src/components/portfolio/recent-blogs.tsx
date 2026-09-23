import { blogs } from '@/data/blogs';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Section } from './section';

export function RecentBlogs() {
  const [featured, ...rest] = blogs;

  return (
    <Section id="insights" title="Latest Writing" comment="From the blog">
      <div className="space-y-3 md:space-y-4">
        {/* Featured post */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group block"
        >
          <div className="glass glass-interactive p-6 md:p-8 overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl !z-0"
            />
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="chip chip-accent">Featured</span>
              <span className="chip">{featured.category}</span>
              <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {featured.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {featured.readTime}
                </span>
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
              {featured.title}
            </h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-6 max-w-3xl">
              {featured.excerpt}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {featured.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="chip">{tag}</span>
                ))}
              </div>
              <span className="tinted-button !py-1.5 !text-sm">
                Read article
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Secondary posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block"
            >
              <div className="glass glass-interactive p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                  <span className="font-medium text-primary">{post.category}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold text-foreground mb-2 leading-snug flex-1">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="chip">{tag}</span>
                    ))}
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href="/blog"
            className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground group"
          >
            View all posts
            <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
