'use client';

import React, { useState } from 'react';
import { blogs } from '@/data/blogs';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const categories = ['All', ...Array.from(new Set(blogs.map((b) => b.category)))];

export function BlogArchiveClient() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredBlogs = selectedCategory === 'All'
    ? blogs
    : blogs.filter((b) => b.category === selectedCategory);

  return (
    <div className="pb-12 lg:pb-16">
      <main className="container mx-auto px-4 md:px-6 pt-10 lg:pt-36 max-w-4xl">
        {/* Page header */}
        <div className="mb-8 space-y-2">
          <p className="eyebrow">Writing</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">Blog</h1>
          <p className="text-[15px] text-muted-foreground max-w-lg">
            Architecture deep-dives · Performance engineering · AI systems · System design.
          </p>
        </div>

        {/* Category filter — glass segmented control */}
        <div className="mb-8 -mx-4 px-4 overflow-x-auto">
          <div className="glass glass-pill inline-flex items-center p-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'relative whitespace-nowrap px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200',
                    isActive ? 'text-primary-foreground' : 'text-foreground/65 hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="blog-filter"
                      className="absolute inset-0 rounded-full bg-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_-4px_hsl(var(--primary)/0.6)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Post list */}
        <div className="space-y-3 md:space-y-4">
          {filteredBlogs.map((post, idx) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block"
            >
              <article className="glass glass-interactive p-6 md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {idx === 0 && selectedCategory === 'All' && (
                      <span className="chip chip-accent">Featured</span>
                    )}
                    <span className="chip">{post.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-5">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span key={tag} className="chip">{tag}</span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Read
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
