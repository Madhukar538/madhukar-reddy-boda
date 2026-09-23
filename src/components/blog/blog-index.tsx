'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bug, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PostCard } from './post-card';
import type { PostSummary } from '@/lib/blog';

/** Search + category filter over every post; the newest leads when unfiltered. */
export function BlogIndex({ posts }: { posts: PostSummary[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => ['All', ...Array.from(new Set(posts.map((p) => p.category)))], [posts]);

  // "/" focuses search, like GitHub and most docs sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea, [contenteditable]');
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = posts
    .filter((p) => category === 'All' || p.category === category)
    .map((p) => {
      if (!terms.length) return { post: p, score: 0 };
      const head = `${p.title} ${p.tags.join(' ')} ${p.category}`.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (head.includes(t)) score += 3;
        else if (p.excerpt.toLowerCase().includes(t)) score += 2;
        else if (p.text.includes(t)) score += 1;
        else return { post: p, score: -1 };
      }
      return { post: p, score };
    })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.post);

  const unfiltered = !terms.length && category === 'All';
  const [lead, ...rest] = results;

  return (
    <section aria-label="Posts" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <label className="glass glass-pill flex flex-1 items-center gap-2.5 px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts: RAG, caching, k6…"
            aria-label="Search posts"
            className="w-full bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/80 outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="rounded-full p-0.5 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden md:inline rounded-md px-1.5 text-[11px] font-medium text-muted-foreground ring-1 ring-foreground/15">/</kbd>
          )}
        </label>

        <div className="-mx-4 px-4 overflow-x-auto md:mx-0 md:px-0">
          <div className="glass glass-pill inline-flex items-center p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={cn(
                  'relative whitespace-nowrap px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors duration-200',
                  category === cat ? 'text-primary-foreground' : 'text-foreground/65 hover:text-foreground'
                )}
              >
                {category === cat && (
                  <motion.span
                    layoutId="blog-index-filter"
                    className="absolute inset-0 rounded-full bg-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_-4px_hsl(var(--primary)/0.6)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {!unfiltered && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {results.length} {results.length === 1 ? 'post' : 'posts'}
          {terms.length ? <> for &ldquo;{query.trim()}&rdquo;</> : null}
          {category !== 'All' ? <> in {category}</> : null}
        </p>
      )}

      {results.length === 0 ? (
        <div className="glass p-8 text-center space-y-3">
          <p className="text-lg font-semibold">Nothing on that yet.</p>
          <p className="text-muted-foreground">If it&apos;s a problem you&apos;re stuck on, I may still be able to help.</p>
          <Link href={`/fix-a-bug?topic=${encodeURIComponent(query.trim())}`} className="tinted-button !inline-flex">
            <Bug className="h-4 w-4" />
            Ask me about it
          </Link>
        </div>
      ) : unfiltered ? (
        <div className="space-y-4">
          <PostCard post={lead} featured />
          <div className="grid gap-4 md:grid-cols-2">
            {rest.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
    </section>
  );
}
