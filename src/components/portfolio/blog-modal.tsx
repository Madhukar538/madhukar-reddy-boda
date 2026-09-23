'use client';

import React, { useEffect, useRef } from 'react';
import { blogs } from '@/data/blogs';
import { X, Calendar, Clock } from 'lucide-react';
import { AuthorCard } from './author-card';
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

  // Close on Escape
  useEffect(() => {
    if (!slug) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slug, onClose]);

  return (
    <AnimatePresence>
      {slug && (
        <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label={post.title}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm cursor-pointer"
          />

          {/* Sheet */}
          <div className="pointer-events-none flex h-full items-end md:items-center justify-center md:p-6">
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="glass glass-strong pointer-events-auto relative w-full max-w-3xl overflow-hidden rounded-b-none md:rounded-b-[var(--glass-radius)]"
              style={{ ['--glass-radius' as string]: '2rem' }}
            >
              {/* Grabber + toolbar */}
              <div className="sticky top-0 z-10 flex items-center gap-3 px-5 pt-3 pb-3 border-b border-foreground/10">
                <div className="absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2 rounded-full bg-foreground/20 md:hidden" />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-foreground/70 hover:bg-foreground/15 hover:text-foreground transition-colors active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                ref={scrollContainerRef}
                className="max-h-[85dvh] md:max-h-[calc(100dvh-8rem)] overflow-y-auto p-6 md:p-10 select-text"
              >
                <div className="mb-8 space-y-4">
                  <span className="chip chip-accent">{post.category}</span>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                    {post.title}
                  </h1>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span key={tag} className="chip">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-foreground/10 pt-8">
                  <ArticleClient content={post.content} />
                </div>

                <div className="mt-12 pt-8 border-t border-foreground/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    About the author
                  </p>
                  <AuthorCard />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
