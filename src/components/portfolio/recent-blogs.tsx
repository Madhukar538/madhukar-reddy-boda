'use client';

import React, { useState } from 'react';
import { blogs } from '@/data/blogs';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, Terminal } from 'lucide-react';
import { Section } from './section';
import { BlogModal } from './blog-modal';

export function RecentBlogs() {
  const [featured, ...rest] = blogs;
  const [activeBlogSlug, setActiveBlogSlug] = useState<string | null>(null);

  return (
    <Section id="insights" title="latest_posts()" comment="Technical blog & writing">
      {/* Terminal command prompt line */}
      <div className="font-mono text-xs text-muted-foreground mb-5 flex items-center gap-2">
        <span className="text-primary">$</span>
        <span>cat /blog --sort=recent --limit=3</span>
        <span className="animate-pulse text-primary">▋</span>
      </div>

      <div className="space-y-4">
        {/* Featured post — full-width */}
        <Link
          href={`/blog/${featured.slug}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveBlogSlug(featured.slug);
          }}
          className="group block"
        >
          <div className="blog-card p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="font-mono text-[10px] text-primary border border-primary/30 bg-primary/5 px-2 py-0.5 rounded-sm font-semibold uppercase tracking-wider">
                FEATURED
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                {featured.category}
              </span>
              <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {featured.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {featured.readTime}
                </span>
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-200 mb-3 leading-snug">
              {featured.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-3xl">
              {featured.excerpt}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {featured.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="code-tag">[{tag}]</span>
                ))}
              </div>
              <span className="flex items-center gap-1.5 font-mono text-xs text-primary group-hover:gap-2.5 transition-all duration-200">
                read_post() <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Secondary posts — compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveBlogSlug(post.slug);
              }}
              className="group block"
            >
              <div className="terminal-card p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                    {post.category}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {post.readTime}
                  </span>
                </div>
                <h3 className="font-mono text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 mb-2 leading-snug flex-1">
                  {post.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="code-tag code-tag-cyan">[{tag}]</span>
                    ))}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Browse all */}
        <div className="flex items-center justify-end pt-2">
          <Link
            href="/blog"
            className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
          >
            <Terminal className="h-3 w-3" />
            $ cat /blog --all
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Blog Overlay Modal */}
      <BlogModal slug={activeBlogSlug} onClose={() => setActiveBlogSlug(null)} />
    </Section>
  );
}
