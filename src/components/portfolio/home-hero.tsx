'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  FileDown,
  FlaskConical,
  FolderKanban,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Monitor,
  Network,
  Plug,
  Phone,
  Twitter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { avatarSrc } from './avatar';
import { useOsMode } from '@/components/os/os-mode';
import { clientProjects, keyProjects, profile, rdProjects, socialLinks } from '@/data/profile';

const stack = [
  'C#', '.NET 10', 'TypeScript', 'Next.js 16', 'React 19', 'Semantic Kernel', 'MCP', 'RAG',
  'Ollama', 'pgvector', 'Solr 9', 'SQL Server', 'PostgreSQL', 'MongoDB', 'ClickHouse', 'Redis',
  'RabbitMQ', 'SignalR', 'gRPC', 'k6', 'Grafana', 'Docker', 'K3s', 'Terraform', 'Playwright',
];

const socialIcons = { GitHub: Github, LinkedIn: Linkedin, Twitter };

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 260, damping: 28 } },
};

/** Facts about the site's writing, computed on the server at build time. */
export type SiteStats = {
  posts: number;
  topics: number;
  latest: { slug: string; title: string; date: string };
  updated: string;
};

function Tile({
  href,
  className,
  children,
  label,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <motion.div variants={item} className={className}>
      <Link
        href={href}
        title={label}
        className="group glass glass-interactive flex h-full flex-col p-5 md:p-6"
      >
        <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-foreground/30 transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        {children}
      </Link>
    </motion.div>
  );
}

function HeroOsButton() {
  const { setEnabled } = useOsMode();
  return (
    <button type="button" onClick={() => setEnabled(true)} className="group inline-flex items-center gap-2 hover:text-foreground transition-colors">
      <Monitor className="h-4 w-4 text-primary" />
      Try desktop mode
    </button>
  );
}

function TileIcon({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={cn('mb-4 flex h-10 w-10 items-center justify-center rounded-2xl', className)}>
      {children}
    </span>
  );
}

export function HomeHero({ stats }: { stats: SiteStats }) {
  const featured = keyProjects.find((p) => p.featured) ?? keyProjects[0];
  const projectCount = keyProjects.length + clientProjects.length;
  const shipped = rdProjects.filter((p) => p.status === 'SHIPPED').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* ── Hero ── */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.35fr_1fr] pb-12 md:pb-16">
        <div className="space-y-6 text-center lg:text-left">
          {/* Phones: a compact identity row, since the profile card is desktop-only. */}
          <motion.div variants={item} className="flex items-center justify-center gap-3 lg:hidden">
            <Image src={avatarSrc} alt="" width={56} height={56} className="rounded-full ring-2 ring-primary/40" priority />
            <span className="text-left text-sm leading-tight">
              <span className="block font-semibold text-foreground">{profile.name}</span>
              <span className="block text-muted-foreground">{profile.title} · {profile.location}</span>
            </span>
          </motion.div>

          <motion.div variants={item} className="flex justify-center lg:justify-start">
            <Link
              href="/fix-a-bug"
              className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--sys-green))] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--sys-green))]" />
              </span>
              Open to fixing bugs &amp; giving solutions
              <ArrowRight className="h-3 w-3 opacity-60" />
            </Link>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground"
          >
            Architecting <span className="text-gradient">fast, observable</span> systems.
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto lg:mx-0 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed"
          >
            I&apos;m <span className="font-semibold text-foreground">Boda Madhukar Reddy</span>, a
            Software Architect in Hyderabad. I design high-throughput .NET APIs, build self-hosted AI
            platforms (RAG, MCP and hybrid search), and load-test everything with k6 + Grafana.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <Link href="/projects" className="tinted-button !px-5 !py-2.5">
              See my work
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/resume.pdf"
              download="Boda-Madhukar-Reddy-Resume.pdf"
              className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground"
            >
              <FileDown className="h-4 w-4 text-primary" />
              Résumé
            </a>
          </motion.div>
        </div>

        {/* Profile card */}
        <motion.div variants={item} className="mx-auto hidden w-full max-w-sm lg:block">
          <div className="glass p-6 text-center">
            <div className="relative mx-auto mb-5 w-fit">
              <div className="absolute -inset-4 rounded-full bg-primary/30 blur-2xl" />
              <div className="relative rounded-full p-1.5 glass glass-pill">
                <Image
                  src={avatarSrc}
                  alt="Boda Madhukar Reddy"
                  width={148}
                  height={148}
                  className="rounded-full object-cover"
                  priority
                />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">Boda Madhukar Reddy</p>
            <p className="text-sm font-medium text-primary">Software Architect</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Hyderabad, India
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="glass-inset py-3">
                <p className="text-2xl font-bold text-foreground">5+</p>
                <p className="text-[11px] text-muted-foreground">Years</p>
              </div>
              <div className="glass-inset py-3">
                <p className="text-2xl font-bold text-foreground">{projectCount}</p>
                <p className="text-[11px] text-muted-foreground">Projects delivered</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Bento grid ── */}
      <section aria-label="Highlights" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Tile href="/experience" label="Experience" className="sm:col-span-2">
          <TileIcon className="bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <Briefcase className="h-5 w-5" />
          </TileIcon>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currently</p>
          <p className="mt-1 text-2xl font-bold text-foreground">Software Architect</p>
          <p className="text-[15px] text-foreground/75">Revalsys Technologies · 2021 – Present</p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Leading .NET R&amp;D: multi-tenant RAG chatbots, MCP servers, hybrid search, offline-first
            apps, and e-commerce platforms for Jockey, Speedo, Manyavar and more.
          </p>
        </Tile>

        <Tile href={`/blog/${stats.latest.slug}`} label="Latest post" className="sm:col-span-2 lg:col-span-2">
          <TileIcon className="bg-[hsl(var(--sys-orange)/0.15)] text-[hsl(var(--sys-orange))]">
            <BookOpen className="h-5 w-5" />
          </TileIcon>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Latest post · {stats.latest.date}</p>
          <p className="mt-1 text-lg font-bold text-foreground leading-snug line-clamp-2">{stats.latest.title}</p>
          <p className="mt-auto pt-4 text-sm text-muted-foreground">
            {stats.posts} posts · {stats.topics} topics · updated {stats.updated}
          </p>
        </Tile>

        <Tile href="/about#skills" label="Tech stack" className="sm:col-span-2 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tech stack</p>
          <p className="mt-1 text-xl font-bold text-foreground">Tools I build with</p>
          <p className="mt-2 mb-5 text-sm text-muted-foreground leading-relaxed">
            Backend, data, messaging, observability and AI — {stack.length}+ technologies used in production.
          </p>
          <div className="marquee mt-auto -mx-5 md:-mx-6">
            <div className="marquee-track gap-2 pr-2">
              {[...stack, ...stack].map((s, i) => (
                <span key={i} className="chip shrink-0" aria-hidden={i >= stack.length}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </Tile>

        <Tile href="/projects" label="Projects" className="sm:col-span-1">
          <TileIcon className="bg-[hsl(var(--sys-teal)/0.15)] text-[hsl(var(--sys-teal))]">
            <FolderKanban className="h-5 w-5" />
          </TileIcon>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Featured</p>
          <p className="mt-1 text-lg font-bold text-foreground leading-snug">{featured.title}</p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{featured.description}</p>
        </Tile>

        <Tile href="/lab" label="R&D Lab" className="sm:col-span-1">
          <TileIcon className="bg-[hsl(var(--sys-purple)/0.15)] text-[hsl(var(--sys-purple))]">
            <FlaskConical className="h-5 w-5" />
          </TileIcon>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">R&amp;D Lab</p>
          <p className="mt-1 text-4xl font-bold text-foreground">{rdProjects.length}</p>
          <p className="text-sm text-muted-foreground">experiments · {shipped} shipped</p>
        </Tile>

        {/* Contact */}
        <motion.div variants={item} className="sm:col-span-2 lg:col-span-4">
          <div className="glass flex flex-col md:flex-row md:items-center gap-5 p-6 md:p-8">
            <div className="flex-1 space-y-1">
              <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Let&apos;s talk.
              </p>
              <p className="text-[15px] text-muted-foreground">
                I&apos;m working at Revalsys Technologies, and happy to help debug issues or suggest solutions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href={`mailto:${profile.email}`} className="tinted-button">
                <Mail className="h-4 w-4" /> Email
              </a>
              <a
                href={profile.phoneHref}
                className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
              {socialLinks.map(({ network: label, href }) => {
                const Icon = socialIcons[label];
                return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="glass glass-pill glass-interactive flex h-9 w-9 items-center justify-center text-foreground/75 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-sm font-medium text-muted-foreground"
        >
          <span className="text-xs font-semibold uppercase tracking-wide">Explore</span>
          <HeroOsButton />
          <Link href="/graph" className="group inline-flex items-center gap-2 hover:text-foreground transition-colors">
            <Network className="h-4 w-4 text-primary" />
            The knowledge graph
          </Link>
          <Link href="/ai" className="group inline-flex items-center gap-2 hover:text-foreground transition-colors">
            <Plug className="h-4 w-4 text-primary" />
            Connect your AI (MCP)
          </Link>
        </motion.div>
      </section>
    </motion.div>
  );
}
