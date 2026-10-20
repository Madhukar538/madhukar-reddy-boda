import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Wrench } from 'lucide-react';
import { ArchitectureDiagram } from '@/components/portfolio/architecture-diagram';
import { caseStudies, type CaseChapter } from '@/data/case-studies';
import { diagrams } from '@/data/diagrams';
import { clampMetaDescription } from '@/lib/blog';

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies.find((c) => c.slug === slug);
  if (!study) return {};
  return {
    title: `${study.project}: case study — Boda Madhukar Reddy`,
    description: clampMetaDescription(study.summary, 155),
    alternates: { canonical: `/projects/${study.slug}` },
  };
}

const fmt = (n: number) => n.toLocaleString('en-US');

function Bars({ chapter }: { chapter: Extract<CaseChapter, { kind: 'bars' }> }) {
  const max = Math.max(...chapter.bars.map((b) => b.value));
  return (
    <figure className="glass p-5 md:p-7">
      <figcaption className="mb-5 text-sm text-muted-foreground">Time per request, in milliseconds</figcaption>
      <ul className="space-y-4">
        {chapter.bars.map((bar) => (
          <li key={bar.label} title={`${bar.label}: ~${fmt(bar.value)} ${chapter.unit}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[15px]">
              <span className={bar.highlight ? 'font-semibold text-foreground' : 'text-foreground/85'}>{bar.label}</span>
              <span className="tabular-nums font-semibold text-foreground">~{fmt(bar.value)} {chapter.unit}</span>
            </div>
            <div className="h-2.5 rounded-full bg-foreground/10">
              <div
                className={`cs-bar h-full rounded-full ${bar.highlight ? 'bg-primary' : 'bg-primary/55'}`}
                style={{ width: `${Math.max(2, (bar.value / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function ChapterBody({ chapter }: { chapter: CaseChapter }) {
  switch (chapter.kind) {
    case 'diagram': {
      const diagram = diagrams[chapter.diagram];
      return diagram ? <ArchitectureDiagram diagram={diagram} /> : null;
    }
    case 'bars':
      return <Bars chapter={chapter} />;
    case 'cards':
      return (
        <div className="grid gap-5 md:gap-6">
          {chapter.cards.map((card, i) => (
            <article key={card.title} className="cs-reveal glass p-6 md:p-7">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Finding {i + 1}</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{card.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{card.body}</p>
              <p className="glass-inset mt-4 flex gap-3 p-4 text-[15px] leading-snug text-foreground">
                <Wrench aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><span className="font-semibold">Fix: </span>{card.fix}</span>
              </p>
            </article>
          ))}
        </div>
      );
    case 'timeline':
      return (
        <ol className="relative space-y-5 border-l border-foreground/15 pl-6 md:pl-8">
          {chapter.steps.map((step) => (
            <li key={step.when} className="cs-reveal relative">
              <span aria-hidden className="absolute -left-[31px] md:-left-[39px] top-6 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
              <div className="glass p-5 md:p-6">
                <p className="text-sm font-semibold text-primary">{step.when}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-foreground">{step.what}</p>
                {step.target && (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold tabular-nums text-foreground">
                    <span className="text-muted-foreground font-normal">Target</span> {step.target}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      );
    case 'text':
      return chapter.points ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {chapter.points.map((point) => (
            <li key={point} className="cs-reveal glass flex gap-3 p-5 text-[15px] leading-relaxed text-foreground">
              <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--sys-green))]" />
              {point}
            </li>
          ))}
        </ul>
      ) : null;
  }
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = caseStudies.find((c) => c.slug === slug);
  if (!study) notFound();

  return (
    <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-10 lg:pt-36 pb-12 lg:pb-20">
      {/* Reading progress, driven by the page scroll (CSS only). */}
      <div aria-hidden className="cs-progress fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-primary" />

      <Link href="/projects" className="tap mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      {/* Hero */}
      <header className="mb-16 md:mb-24 max-w-4xl space-y-5">
        <p className="eyebrow">Case study · {study.project}</p>
        <h1 className="text-[2.3rem] sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.05] text-foreground">{study.title}</h1>
        <p className="max-w-3xl text-base md:text-lg leading-relaxed text-muted-foreground">{study.summary}</p>
        <dl className="grid gap-4 pt-4 sm:grid-cols-3">
          {study.stats.map((s) => (
            <div key={s.label} className="glass flex flex-col gap-1 p-5">
              <dt className="order-2 text-sm text-muted-foreground">{s.label}</dt>
              <dd className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums text-foreground">{s.value}</dd>
            </div>
          ))}
        </dl>
        {study.note && <p className="text-sm text-muted-foreground">{study.note}</p>}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {study.tech.map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      </header>

      {/* Chapters: the number and title stay pinned while the chapter scrolls by. */}
      <div className="space-y-20 md:space-y-28">
        {study.chapters.map((chapter, i) => (
          <section key={chapter.id} id={chapter.id} aria-labelledby={`${chapter.id}-title`} className="scroll-mt-28 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="text-5xl md:text-6xl font-bold tracking-tight tabular-nums text-primary/80">{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{chapter.label}</p>
            </div>
            <div className="min-w-0 space-y-5">
              <h2 id={`${chapter.id}-title`} className="cs-reveal text-2xl md:text-4xl font-bold tracking-tight text-foreground">{chapter.title}</h2>
              {chapter.body?.map((p) => (
                <p key={p} className="cs-reveal max-w-3xl text-base md:text-lg leading-relaxed text-muted-foreground">{p}</p>
              ))}
              <div className="pt-2">
                <ChapterBody chapter={chapter} />
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Next steps */}
      <div className="mt-20 md:mt-28 flex flex-wrap items-center gap-3">
        {study.post && (
          <Link href={`/blog/${study.post}`} className="tinted-button !px-5 !py-2.5">
            Read the full write-up <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Link href="/projects" className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
          More projects
        </Link>
        <Link href="/fix-a-bug" className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
          Have a slow system? Let&apos;s talk
        </Link>
      </div>
    </div>
  );
}
