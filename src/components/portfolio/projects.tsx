'use client';

import { useState, type ReactNode } from 'react';
import { m } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';
import { Section } from '@/components/portfolio/section';
import { Callout } from '@/components/vault/callout';
import type { ClientProject, ProjectCard } from '@/data/profile';
import { anchorId, cn } from '@/lib/utils';
import { caseStudyFor } from '@/data/case-studies';

function WriteUp({ slug }: { slug: string }) {
  return (
    <Link href={`/blog/${slug}`} className="tap group mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary">
      Read the write-up
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function CaseStudyLink({ slug }: { slug: string }) {
  return (
    <Link href={`/projects/${slug}`} className="tap group mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary">
      Read the case study
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function FeaturedCard({ project }: { project: ProjectCard }) {
  const study = caseStudyFor(project.title);
  return (
    <article id={anchorId(project.title)} data-previews className="cs-reveal glass glass-interactive flex flex-col p-6 md:p-7 scroll-mt-28">
      <h3 className="text-xl font-bold tracking-tight text-foreground leading-snug mb-2">{project.title}</h3>
      <p className="text-[15px] text-muted-foreground leading-relaxed flex-1 mb-5">{project.description}</p>
      {project.outcome && (
        <Callout kind="success" title="Outcome" className="mb-5 text-sm leading-snug">
          {project.outcome}
        </Callout>
      )}
      <div className="chips-few flex flex-wrap gap-1.5">
        {project.tech.map((tech) => (
          <span key={tech} className="chip">{tech}</span>
        ))}
      </div>
      {study ? <CaseStudyLink slug={study.slug} /> : project.post && <WriteUp slug={project.post} />}
    </article>
  );
}

function CompactCard({ project }: { project: ProjectCard }) {
  return (
    <article id={anchorId(project.title)} data-previews className="cs-reveal glass glass-interactive flex flex-col p-6 scroll-mt-28">
      <h3 className="text-base font-semibold text-foreground mb-1.5 leading-snug">{project.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1 mb-3">{project.description}</p>
      <div className="chips-few flex flex-wrap gap-1.5">
        {project.tech.slice(0, 3).map((tech) => (
          <span key={tech} className="chip">{tech}</span>
        ))}
      </div>
      {project.post && <WriteUp slug={project.post} />}
    </article>
  );
}

/** A quiet label with a hairline rule that groups a run of cards. */
function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <h3 className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{children}</h3>
      <span aria-hidden className="h-px flex-1 bg-foreground/10" />
    </div>
  );
}

type Area = 'ai' | 'platform' | 'tools';
const AREAS: { id: 'all' | Area | 'ecommerce'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI' },
  { id: 'platform', label: 'Platforms' },
  { id: 'tools', label: 'Dev tools' },
  { id: 'ecommerce', label: 'E-commerce' },
];

/** Which area a project belongs to, from its own title, description and stack. */
function areaOf(p: ProjectCard): Area {
  const text = `${p.title} ${p.description} ${p.tech.join(' ')}`;
  if (/\b(RAG|LLMs?|Semantic Kernel|LangChain|chatbot|OpenCV|FaceAuth|AI)\b/i.test(text)) return 'ai';
  if (/extension|plug-?in|add-in|NuGet|IntelliSense/i.test(text)) return 'tools';
  return 'platform';
}

export function Projects({ keyProjects, clientProjects }: { keyProjects: ProjectCard[]; clientProjects: ClientProject[] }) {
  const [area, setArea] = useState<(typeof AREAS)[number]['id']>('all');
  const showKey = (p: ProjectCard) => area === 'all' || area === areaOf(p);
  const featured = keyProjects.filter((p) => p.featured && showKey(p));
  const rest = keyProjects.filter((p) => !p.featured && showKey(p));
  const showClients = area === 'all' || area === 'ecommerce';
  const count = (id: (typeof AREAS)[number]['id']) =>
    id === 'all' ? keyProjects.length + clientProjects.length : id === 'ecommerce' ? clientProjects.length : keyProjects.filter((p) => areaOf(p) === id).length;

  return (
    <Section id="projects" title="Key Projects" comment="Systems and e-commerce builds">
      <div className="mb-8 -mx-4 px-4 overflow-x-auto">
        <div className="glass glass-pill inline-flex items-center p-1" role="group" aria-label="Filter projects by area">
          {AREAS.map(({ id, label }) => {
            const active = area === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setArea(id)}
                className={cn(
                  'relative whitespace-nowrap px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors duration-200',
                  active ? 'text-primary-foreground' : 'text-foreground/65 hover:text-foreground'
                )}
              >
                {active && (
                  <m.span
                    layoutId="projects-filter"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">
                  {label} <span className="font-normal tabular-nums">{count(id)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {featured.length > 0 && (
        <>
          <GroupLabel>Featured</GroupLabel>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 mb-12">
            {featured.map((project) => (
              <FeaturedCard key={project.title} project={project} />
            ))}
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <GroupLabel>More systems built from scratch</GroupLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-14">
            {rest.map((project) => (
              <CompactCard key={project.title} project={project} />
            ))}
          </div>
        </>
      )}

      {showClients && (
      <>
      <GroupLabel>E-commerce portals &amp; integrations</GroupLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {clientProjects.map((project) => (
          <article key={project.id} id={anchorId(project.title)} className="cs-reveal glass p-5 md:p-6 flex flex-col scroll-mt-28">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
              <h3 className="text-lg font-bold text-foreground">{project.title}</h3>
              <span className="text-xs tabular-nums text-muted-foreground">{project.duration}</span>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="chip chip-accent">{project.role}</span>
              {project.client !== project.title && <span className="chip">{project.client}</span>}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">{project.description}</p>
            <div className="chips-few flex flex-wrap gap-1.5 mb-4">
              {project.tech.slice(0, 5).map((t) => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap items-start justify-between gap-3">
              <details className="group/details flex-1 min-w-[12rem]">
                <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-foreground/80 hover:text-foreground [&::-webkit-details-marker]:hidden">
                  What I did
                  <ChevronDown className="h-4 w-4 transition-transform group-open/details:rotate-180" />
                </summary>
                <ul className="mt-3 space-y-2">
                  {project.responsibilities.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                      <span className="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              </details>
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  Visit site
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      </>
      )}
    </Section>
  );
}
