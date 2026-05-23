'use client';

import React, { useState } from 'react';
import { blogs } from '@/data/blogs';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, Terminal } from 'lucide-react';
import { BlogModal } from './blog-modal';

const categories = ['All', 'Software Architecture', 'Observability', 'Artificial Intelligence'];

export function BlogArchiveClient() {
  const [activeBlogSlug, setActiveBlogSlug] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredBlogs = selectedCategory === 'All'
    ? blogs
    : blogs.filter((b) => b.category === selectedCategory);

  return (
    <div className="min-h-dvh pb-24">
      <main className="container mx-auto px-4 md:px-6 pt-24 max-w-4xl">

        {/* Page header */}
        <div className="mb-12 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary">$</span>
            <span>ls ~/blog --sort=date --format=long</span>
          </div>
          <h1 className="font-mono text-3xl md:text-4xl font-bold text-foreground">
            <span className="neon-text">/</span>blog
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Architecture deep-dives · Performance engineering · AI systems · System design.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`font-mono text-xs px-3 py-1.5 rounded-sm border transition-all duration-200 ${
                selectedCategory === cat
                  ? 'border-primary/40 text-primary bg-primary/8'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-primary/80'
              }`}
            >
              [{cat}]
            </button>
          ))}
        </div>

        {/* Post list */}
        <div className="space-y-5">
          {filteredBlogs.map((post, idx) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveBlogSlug(post.slug);
              }}
              className="group block"
            >
              <article
                className="blog-card p-6 md:p-7"
                style={{ borderTopColor: idx === 0 && selectedCategory === 'All' ? 'hsl(var(--neon-green))' : undefined }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {idx === 0 && selectedCategory === 'All' && (
                      <span className="font-mono text-[10px] text-primary border border-primary/30 bg-primary/5 px-2 py-0.5 rounded-sm font-semibold uppercase">
                        FEATURED
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-yellow-400/80 uppercase tracking-wider">
                      {post.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200 mb-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span key={tag} className="code-tag">[{tag}]</span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-primary group-hover:gap-2.5 transition-all duration-200">
                    read() <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>

      {/* Blog Overlay Modal */}
      <BlogModal slug={activeBlogSlug} onClose={() => setActiveBlogSlug(null)} />
    </div>
  );
}
