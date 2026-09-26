import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bug, Rss } from 'lucide-react';
import { BlogIndex } from '@/components/blog/blog-index';
import { LegacyHashRedirect } from '@/components/blog/legacy-hash-redirect';
import { allTopics, summaries } from '@/lib/blog';
import { getContent } from '@/lib/content';
import { RollingText } from '@/components/vault/rolling-text';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': [{ url: '/rss.xml', title: 'Boda Madhukar Reddy — Engineering blog' }] },
  },
};

export default async function Home() {
  const { posts } = await getContent();
  const topics = allTopics(posts);

  return (
    <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-10 lg:pt-36 pb-12 lg:pb-16">
      <LegacyHashRedirect />

      {/* Intro */}
      <header className="mb-10 md:mb-14 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-4 max-w-3xl">
          <Link href="/about" className="group inline-flex items-center gap-3">
            <Image src="/madhukar.png" alt="" width={44} height={44} className="rounded-full ring-2 ring-primary/40" priority />
            <span className="text-sm leading-tight">
              <span className="block font-semibold text-foreground group-hover:text-primary transition-colors">Boda Madhukar Reddy</span>
              <span className="block text-muted-foreground">Software Architect · Revalsys, Hyderabad</span>
            </span>
          </Link>
          <h1 className="text-[2.4rem] leading-[1.05] sm:text-6xl font-bold tracking-tight text-foreground">
            Notes from building{' '}
            <RollingText words={['fast, observable', 'self-hosted AI', 'load-tested', 'production-grade']} />{' '}
            systems.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Field notes on .NET performance, self-hosted AI (RAG, MCP, hybrid search), load testing and homelab
            infrastructure. Written from real production work.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 md:justify-end">
          <Link href="/fix-a-bug" className="tinted-button !px-4 !py-2">
            <Bug className="h-4 w-4" />
            Stuck on a bug?
          </Link>
          <a href="/rss.xml" className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-4 py-2 text-sm font-medium">
            <Rss className="h-4 w-4 text-[hsl(var(--sys-orange))]" />
            RSS
          </a>
        </div>
      </header>

      <BlogIndex posts={summaries(posts)} />

      {/* Topics */}
      <section aria-labelledby="topics-heading" className="mt-14 md:mt-20">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Browse</p>
            <h2 id="topics-heading" className="text-2xl md:text-3xl font-bold tracking-tight">Topics</h2>
          </div>
          <Link href="/topics" className="flex items-center gap-1 text-sm font-semibold text-primary">
            All topics <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.slice(0, 18).map((t) => (
            <Link
              key={t.slug}
              href={`/topics/${t.slug}`}
              className={
                t.kind === 'category'
                  ? 'glass glass-pill glass-interactive px-4 py-2 text-sm font-semibold'
                  : 'chip hover:text-foreground transition-colors !text-[0.8rem] !px-3 !py-1.5'
              }
            >
              {t.name}
              <span className="ml-1.5 text-muted-foreground font-normal">{t.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* About strip */}
      <section className="mt-14 md:mt-20 glass p-6 md:p-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-1.5">
          <p className="eyebrow">Who writes this</p>
          <p className="text-lg md:text-xl font-semibold text-foreground">
            I design high-throughput .NET APIs and self-hosted AI platforms, and I load-test everything.
          </p>
          <p className="text-muted-foreground">Working at Revalsys, and open to fixing bugs and giving solutions.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/about" className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-4 py-2 text-sm font-medium">
            About me
          </Link>
          <Link href="/projects" className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-4 py-2 text-sm font-medium">
            Projects
          </Link>
          <Link href="/fix-a-bug" className="tinted-button !px-4 !py-2">
            Fix a bug
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
