import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';
import { Section } from '@/components/portfolio/section';
import { Callout } from '@/components/vault/callout';
import { clientProjects, keyProjects, type ProjectCard } from '@/data/profile';
import { anchorId } from '@/lib/utils';

function WriteUp({ slug }: { slug: string }) {
  return (
    <Link href={`/blog/${slug}`} className="group mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary">
      Read the write-up
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function FeaturedCard({ project }: { project: ProjectCard }) {
  return (
    <article id={anchorId(project.title)} className="glass glass-interactive flex flex-col p-6 md:p-7 scroll-mt-28">
      <h3 className="text-xl font-bold tracking-tight text-foreground leading-snug mb-2">{project.title}</h3>
      <p className="text-[15px] text-muted-foreground leading-relaxed flex-1 mb-5">{project.description}</p>
      {project.outcome && (
        <Callout kind="success" title="Outcome" className="mb-5 text-sm leading-snug">
          {project.outcome}
        </Callout>
      )}
      <div className="flex flex-wrap gap-1.5">
        {project.tech.map((tech) => (
          <span key={tech} className="chip">{tech}</span>
        ))}
      </div>
      {project.post && <WriteUp slug={project.post} />}
    </article>
  );
}

function CompactCard({ project }: { project: ProjectCard }) {
  return (
    <article id={anchorId(project.title)} className="glass glass-interactive flex flex-col p-5 scroll-mt-28">
      <h3 className="text-[15px] font-semibold text-foreground mb-1 leading-snug">{project.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1 mb-3">{project.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {project.tech.slice(0, 3).map((tech) => (
          <span key={tech} className="chip">{tech}</span>
        ))}
      </div>
      {project.post && <WriteUp slug={project.post} />}
    </article>
  );
}

export function Projects() {
  const featured = keyProjects.filter((p) => p.featured);
  const rest = keyProjects.filter((p) => !p.featured);

  return (
    <Section id="projects" title="Key Projects" comment="Systems and e-commerce builds">
      <p className="mb-3 text-sm font-semibold text-foreground/70">Featured</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-10">
        {featured.map((project) => (
          <FeaturedCard key={project.title} project={project} />
        ))}
      </div>

      <p className="mb-3 text-sm font-semibold text-foreground/70">More systems built from scratch</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {rest.map((project) => (
          <CompactCard key={project.title} project={project} />
        ))}
      </div>

      <p className="mb-3 text-sm font-semibold text-foreground/70">E-commerce portals &amp; integrations</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {clientProjects.map((project) => (
          <article key={project.id} id={anchorId(project.title)} className="glass p-5 md:p-6 flex flex-col scroll-mt-28">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
              <h3 className="text-lg font-bold text-foreground">{project.title}</h3>
              <span className="text-xs tabular-nums text-muted-foreground">{project.duration}</span>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="chip chip-accent">{project.role}</span>
              {project.client !== project.title && <span className="chip">{project.client}</span>}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">{project.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
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
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  Visit site
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
