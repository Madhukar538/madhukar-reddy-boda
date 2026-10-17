import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Bug,
  CheckCircle2,
  FlaskConical,
  FolderKanban,
  Network,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { stack } from '@/data/stack';
import type { SiteContent } from '@/lib/content';
import { caseStudyFor } from '@/data/case-studies';

export type BentoContent = Pick<SiteContent, 'experience' | 'keyProjects' | 'rdProjects'> & {
  postCount: number;
  topicCount: number;
};

/** A whole-tile link with the corner arrow every bento tile shares. */
function Tile({ href, label, className, children }: { href: string; label: string; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      title={label}
      className={cn('group glass glass-interactive flex flex-col p-4 sm:p-5 md:p-6', className)}
    >
      <ArrowUpRight
        aria-hidden
        className="absolute right-4 top-4 sm:right-5 sm:top-5 h-4 w-4 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
      {children}
    </Link>
  );
}

function TileIcon({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span aria-hidden className={cn('mb-4 flex h-10 w-10 items-center justify-center rounded-2xl', className)}>
      {children}
    </span>
  );
}

const label = 'pr-6 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground';

/** The home page at a glance: who I am, my best work, and ways in. */
export function HomeBento({ content }: { content: BentoContent }) {
  const { experience, keyProjects, rdProjects, postCount, topicCount } = content;
  const featured = keyProjects.find((p) => p.featured && p.outcome) ?? keyProjects.find((p) => p.featured) ?? keyProjects[0];
  const study = featured ? caseStudyFor(featured.title) : undefined;
  const shipped = rdProjects.filter((p) => p.status === 'SHIPPED').length;
  const startYear = Number(experience.duration.match(/\d{4}/)?.[0] ?? 2021);
  const years = new Date().getFullYear() - startYear;

  return (
    <section aria-labelledby="highlights-heading" className="mb-12 md:mb-16">
      <h2 id="highlights-heading" className="sr-only">Highlights</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Featured project: the biggest tile, with its measured result. */}
        {featured && (
          <Tile
            href={study ? `/projects/${study.slug}` : featured.post ? `/blog/${featured.post}` : '/projects'}
            label={`Featured project: ${featured.title}`}
            className="col-span-2 lg:row-span-2 md:p-8"
          >
            <TileIcon className="bg-[hsl(var(--sys-teal)/0.15)] text-[hsl(var(--sys-teal))]">
              <FolderKanban className="h-5 w-5" />
            </TileIcon>
            <p className={label}>Featured project</p>
            <p className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
              {featured.title}
            </p>
            <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed line-clamp-4">{featured.description}</p>
            {featured.outcome && (
              <div className="glass-inset mt-5 flex gap-3 p-4">
                <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--sys-green))]" />
                <p className="text-[15px] font-medium text-foreground leading-snug">{featured.outcome}</p>
              </div>
            )}
            <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
              <div className="flex flex-wrap gap-1.5">
                {featured.tech.slice(0, 4).map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                {study ? 'Read the case study' : featured.post ? 'Read the write-up' : 'See all projects'}
                <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Tile>
        )}

        {/* Current role */}
        <Tile href="/experience" label="Experience" className="col-span-2">
          <TileIcon className="bg-primary text-primary-foreground">
            <Briefcase className="h-5 w-5" />
          </TileIcon>
          <p className={label}>Currently</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{experience.title}</p>
          <p className="text-[15px] text-foreground/75">
            {experience.company} · {experience.duration}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {experience.highlights.map((h) => (
              <span key={h.label} className="chip">{h.label}</span>
            ))}
          </div>
        </Tile>

        {/* Numbers */}
        <Tile href="/about" label="About me" className="justify-between">
          <p className={label}>By the numbers</p>
          <div className="mt-4 space-y-3">
            <p>
              <span className="block text-4xl font-bold tracking-tight text-foreground tabular-nums">{years}+</span>
              <span className="text-sm text-muted-foreground">years building since {startYear}</span>
            </p>
            <p>
              <span className="block text-4xl font-bold tracking-tight text-foreground tabular-nums">{postCount}</span>
              <span className="text-sm text-muted-foreground">posts · {topicCount} topics</span>
            </p>
          </div>
        </Tile>

        {/* The one call to action, in the accent colour. */}
        <Tile href="/fix-a-bug" label="Fix a bug" className="bento-accent justify-between">
          <TileIcon className="bg-primary-foreground/15 text-primary-foreground">
            <Bug className="h-5 w-5" />
          </TileIcon>
          <div>
            <p className="text-lg sm:text-xl font-bold tracking-tight leading-tight">Stuck on a bug?</p>
            <p className="mt-1 text-sm opacity-90">Send it over and I&apos;ll help you debug it or suggest a fix.</p>
          </div>
        </Tile>

        {/* Tech stack ticker */}
        <Tile href="/about#skills" label="Tech stack" className="col-span-2">
          <p className={label}>Tech stack</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-foreground">Tools I build with</p>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            {stack.length}+ technologies across backend, data, messaging, observability and AI.
          </p>
          <div className="marquee mt-auto -mx-4 sm:-mx-5 md:-mx-6">
            <div className="marquee-track gap-2 pr-2">
              {[...stack, ...stack].map((s, i) => (
                <span key={i} className="chip shrink-0" aria-hidden={i >= stack.length}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </Tile>

        {/* R&D Lab */}
        <Tile href="/lab" label="R&D Lab">
          <TileIcon className="bg-[hsl(var(--sys-purple)/0.15)] text-[hsl(var(--sys-purple))]">
            <FlaskConical className="h-5 w-5" />
          </TileIcon>
          <p className={label}>R&amp;D Lab</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-foreground tabular-nums">{rdProjects.length}</p>
          <p className="text-sm text-muted-foreground">experiments · {shipped} shipped</p>
        </Tile>

        {/* Ways to explore: two links, so the tile itself isn't one. */}
        <div className="glass flex flex-col gap-1 p-2.5 md:p-4">
          <p className={cn(label, 'px-2 pt-1 pb-2')}>Explore</p>
          <Link href="/graph" className="group flex items-center gap-3 rounded-2xl px-2 py-2.5 text-sm sm:text-[15px] font-medium leading-tight text-foreground hover:text-primary transition-colors">
            <Network aria-hidden className="h-5 w-5 shrink-0 text-primary" />
            Knowledge graph
            <ArrowRight aria-hidden className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <Link href="/ai" className="group flex items-center gap-3 rounded-2xl px-2 py-2.5 text-sm sm:text-[15px] font-medium leading-tight text-foreground hover:text-primary transition-colors">
            <Plug aria-hidden className="h-5 w-5 shrink-0 text-primary" />
            Connect your AI
            <ArrowRight aria-hidden className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}
