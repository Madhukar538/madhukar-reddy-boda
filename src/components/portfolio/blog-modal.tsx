'use client';

import React, { useEffect, useRef } from 'react';
import { blogs } from '@/data/blogs';
import { X, Calendar, Clock, Terminal } from 'lucide-react';
import { ArticleClient } from './article-client';
import { motion, AnimatePresence } from 'framer-motion';

interface BlogModalProps {
  slug: string | null;
  onClose: () => void;
}

export function BlogModal({ slug, onClose }: BlogModalProps) {
  const post = blogs.find((p) => p.slug === slug) || blogs[0];
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (slug) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [slug]);

  // Reset scroll position when post changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [slug]);

  return (
    <AnimatePresence>
      {slug && (
        <div className="fixed inset-0 z-[200] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <div className="flex min-h-screen items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-3xl bg-background/95 border border-border/80 rounded-sm shadow-2xl overflow-hidden z-10"
            >
              {/* Terminal chrome header */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-card/80 select-none">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70 cursor-pointer hover:bg-red-500" onClick={onClose} />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 font-mono text-xs text-muted-foreground truncate max-w-[200px] md:max-w-xs">
                  {post.slug}.md
                </span>

                <div className="ml-auto flex items-center gap-4 text-xs font-mono text-muted-foreground">
                  <span className="hidden md:flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {post.date}
                  </span>
                  <span className="hidden md:flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                  <button
                    onClick={onClose}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-primary/20 hover:border-primary/50 text-[10px] text-primary hover:bg-primary/5 uppercase tracking-wide transition-all"
                  >
                    <X className="h-3 w-3" />
                    [exit]
                  </button>
                </div>
              </div>

              {/* Modal scroll area */}
              <div
                ref={scrollContainerRef}
                className="max-h-[calc(100vh-120px)] overflow-y-auto p-6 md:p-10 scrollbar-thin select-text"
              >
                {/* Meta */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="font-mono text-[10px] text-yellow-400/80 border border-yellow-400/20 bg-yellow-400/5 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      {post.category}
                    </span>
                    <span className="md:hidden font-mono text-[10px] text-muted-foreground/60">
                      {post.date} · {post.readTime}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    {post.title}
                  </h1>

                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span key={tag} className="code-tag">[{tag}]</span>
                    ))}
                  </div>
                </div>

                {/* Article body */}
                <div className="border-t border-border pt-6">
                  <ArticleClient content={post.content} />
                </div>

                {/* Author block — whoami style */}
                <div className="mt-12 pt-8 border-t border-border">
                  <p className="font-mono text-xs text-muted-foreground/60 mb-4">
                    {'$ whoami'}
                  </p>
                  <div className="terminal-card p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center font-mono font-bold text-primary text-sm shrink-0">
                        MR
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-mono text-sm font-bold text-foreground">
                          Boda Madhukar Reddy
                        </p>
                        <p className="font-mono text-xs text-primary">
                          // Software Architect @ Revalsys Technologies
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Building high-throughput .NET Core systems, load-testing with k6 + Grafana,
                          and engineering AI-driven automation tools. Writing about real-world
                          engineering problems and production-first solutions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
