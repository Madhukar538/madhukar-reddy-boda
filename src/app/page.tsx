import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, FileDown, Handshake } from 'lucide-react';
import { BlogIndex } from '@/components/blog/blog-index';
import { PopularPosts } from '@/components/blog/post-engagement';
import { HomeBento } from '@/components/blog/home-bento';
import { LegacyHashRedirect } from '@/components/blog/legacy-hash-redirect';
import { allTopics, summaries } from '@/lib/blog';
import { getContent } from '@/lib/content';
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

      {/* Intro. In Midnight the portrait sits on the right; text is constrained to the left so it never overlaps the face. */}
      <header className="portrait-offset relative mb-10 md:mb-14 flex flex-col justify-center gap-5 lg:min-h-[28rem] portrait-text">
        <Link href="/about" className="portrait-alt group inline-flex w-fit items-center gap-4">
          <span className="relative shrink-0">
            <span aria-hidden className="absolute -inset-2 rounded-full bg-primary/25 blur-xl" />
            <Image src="/madhukar.png" alt="" width={72} height={72} preload className="relative h-[72px] w-[72px] rounded-full object-cover ring-2 ring-primary/40" />
          </span>
          <span className="text-sm leading-tight">
            <span className="block font-semibold text-foreground group-hover:text-primary transition-colors">Boda Madhukar Reddy</span>
            <span className="block text-muted-foreground">Software Engineer · Revalsys, Hyderabad</span>
          </span>
        </Link>
        {posts[0] && <NowCard now={profile.now} updatedAt={profile.nowUpdatedAt} latest={{ slug: posts[0].slug, title: posts[0].title }} />}
        <HeroIdentity />
        <h1 className="text-[clamp(1.9rem,3.8vw,3.15rem)] leading-[1.12] font-bold tracking-tight text-foreground">
          Engineering high-throughput <span className="text-primary">.NET architectures</span> &amp; self-hosted <span className="text-primary">AI systems</span>.
        </h1>
        <p className="max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
          Senior Backend Engineer building multi-tenant RAG &amp; MCP platforms, Solr 9 hybrid vector search, and k6-validated high-performance APIs for enterprise e-commerce scale.
        </p>
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Link href="/projects" className="tinted-button !px-5 !py-2.5">
            Explore work
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/work-with-me" className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-primary">
            <Handshake className="h-4 w-4" />
            Work with me
          </Link>
          <a href="/resume.pdf" download="Boda-Madhukar-Reddy-Resume.pdf" className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium">
            <FileDown className="h-4 w-4 text-muted-foreground" />
            Résumé (PDF)
          </a>
        </div>

        {/* Quick Highlights / Metrics Strip - safely contained in left column */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 pt-6 mt-2 border-t border-foreground/10">
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">40s → 13s</span>
            <span className="text-xs text-muted-foreground font-medium mt-0.5">RAG latency reduction</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">5–50 ms</span>
            <span className="text-xs text-muted-foreground font-medium mt-0.5">MongoDB query tuning</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">1,792 GB/s</span>
            <span className="text-xs text-muted-foreground font-medium mt-0.5">GPU inference bandwidth</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">5+ Years</span>
            <span className="text-xs text-muted-foreground font-medium mt-0.5">Production systems</span>
          </div>
        </div>
      </header>

      <HomeBento content={{ experience, keyProjects, rdProjects, postCount: posts.length, topicCount: topics.length }} />

      <BlogIndex posts={summaries(posts)} />

      <PopularPosts className="mt-14 md:mt-20 md:[&_ol]:grid md:[&_ol]:grid-cols-2 md:[&_ol]:gap-x-4" />

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
