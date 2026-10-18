import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Rss } from 'lucide-react';
import { BlogIndex } from '@/components/blog/blog-index';
import { HomeBento } from '@/components/blog/home-bento';
import { LegacyHashRedirect } from '@/components/blog/legacy-hash-redirect';
import { allTopics, summaries } from '@/lib/blog';
import { getContent } from '@/lib/content';
import { RollingText } from '@/components/vault/rolling-text';
import { PortraitBackdrop } from '@/components/portfolio/portrait-backdrop';
import { HeroIdentity } from '@/components/portfolio/hero-identity';
import { NowCard } from '@/components/portfolio/now-card';

export const metadata: Metadata = {
  // og:url for link previews (WhatsApp, LinkedIn); page-level openGraph replaces the layout's, so it is repeated.
  openGraph: { type: 'website', url: '/', siteName: 'Boda Madhukar Reddy', locale: 'en_IN' },
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': [{ url: '/rss.xml', title: 'Boda Madhukar Reddy — Engineering blog' }] },
  },
};

export default async function Home() {
  const { posts, experience, keyProjects, rdProjects, profile } = await getContent();
  const topics = allTopics(posts);

  return (
    <>
    <PortraitBackdrop />
    <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-10 lg:pt-36 pb-12 lg:pb-16">
      <LegacyHashRedirect />

      {/* Intro. In Midnight the portrait sits to the right (or above, on phones). */}
      <header className="portrait-offset relative mb-10 md:mb-14 flex flex-col justify-center gap-5 lg:min-h-[28rem]">
        <Link href="/about" className="portrait-alt group inline-flex w-fit items-center gap-3">
          <Image src="/madhukar.png" alt="" width={44} height={44} className="rounded-full ring-2 ring-primary/40" priority />
          <span className="text-sm leading-tight">
            <span className="block font-semibold text-foreground group-hover:text-primary transition-colors">Boda Madhukar Reddy</span>
            <span className="block text-muted-foreground">Software Architect · Revalsys, Hyderabad</span>
          </span>
        </Link>
        {posts[0] && <NowCard now={profile.now} updatedAt={profile.nowUpdatedAt} latest={{ slug: posts[0].slug, title: posts[0].title }} />}
        <HeroIdentity />
        <h1 className="text-[clamp(1.85rem,10vw,2.4rem)] leading-[1.05] sm:text-6xl lg:text-[4.25rem] font-bold tracking-tight text-foreground">
          Notes from building{' '}
          <RollingText className="rolling-line" words={['fast, observable', 'self-hosted AI', 'load-tested', 'production-grade']} />{' '}
          systems.
        </h1>
        <p className="max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
          Field notes on .NET performance, self-hosted AI (RAG, MCP, hybrid search), load testing and homelab
          infrastructure. Written from real production work.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <Link href="/projects" className="tinted-button !px-5 !py-2.5">
            See my work
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/about" className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
            About me
          </Link>
          <a href="/rss.xml" className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium">
            <Rss className="h-4 w-4 text-[hsl(var(--sys-orange))]" />
            RSS
          </a>
        </div>
      </header>

      <HomeBento content={{ experience, keyProjects, rdProjects, postCount: posts.length, topicCount: topics.length }} />

      <BlogIndex posts={summaries(posts)} />

      {/* Topics */}
      <section aria-labelledby="topics-heading" className="mt-14 md:mt-20">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Browse</p>
            <h2 id="topics-heading" className="text-2xl md:text-3xl font-bold tracking-tight">Topics</h2>
          </div>
          <Link href="/topics" className="tap flex items-center gap-1 text-sm font-semibold text-primary">
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

    </div>
    </>
  );
}
