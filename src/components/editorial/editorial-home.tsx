import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, FileDown } from 'lucide-react';
import type { ProjectCard } from '@/data/profile';
import { caseStudyFor } from '@/data/case-studies';

/**
 * The Editorial look's homepage: a kinetic name, a running ticker, the numbers and a
 * sideways gallery of projects. It is in the page for every look but only shown in
 * Editorial (globals.css), so switching looks needs no new request. The moving parts are
 * components/editorial/editorial-fx.tsx; without them this is a still, readable page.
 */

const NAME = ['Madhu—', 'kar', 'Reddy'];
/** Panels in the sideways gallery before the "All projects" one: enough to show range, short enough to scroll. */
const SHOWN = 6;
const TICKER = ['AI Architect', '.NET 8–10', 'Agentic AI', 'RAG', 'MCP', 'Solr 9 hybrid search', 'k6 load testing', 'MongoDB', 'Hyderabad'];

type Metric = { value: string; label: string };

function projectHref(project: ProjectCard) {
  const study = caseStudyFor(project.title);
  if (study) return `/projects/${study.slug}`;
  return project.post ? `/blog/${project.post}` : '/projects';
}

export function EditorialHome({ projects, metrics, since }: { projects: ProjectCard[]; metrics: Metric[]; since: string }) {
  return (
    <div className="home-editorial">
      <section className="ed-hero" aria-labelledby="ed-title">
        <h1 id="ed-title" className="sr-only">
          Boda Madhukar Reddy: I build fast .NET systems, and ship them with teams of AI agents.
        </h1>
        <p className="ed-meta" aria-hidden>
          <span>Portfolio</span>
          <span>Senior Software Engineer · AI Architect</span>
          <span>{since} →</span>
        </p>
        <figure className="ed-portrait" aria-hidden>
          <Image src="/portrait-cutout.webp" alt="" fill sizes="(min-width: 700px) 26vw, 1px" className="object-contain object-bottom" />
          <figcaption>Fig. 01 — Hyderabad, IN</figcaption>
        </figure>
        <div className="ed-name" aria-hidden>
          {NAME.map((line, l) => (
            <span key={line} className="ed-line" data-line={l}>
              {Array.from(line).map((ch, i) => (
                <span key={i} className="ed-char" style={{ '--i': l * 6 + i } as React.CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </div>
        <div className="ed-intro">
          <p className="ed-lede" aria-hidden>
            Builds fast <strong>.NET</strong> systems, and ships them with <em>teams of AI agents</em>.
          </p>
          <p className="ed-body">
            Senior backend engineer at Revalsys, Hyderabad. I lead AI coding agents (Claude Code, Codex, Copilot, Antigravity) with specs, skills and review, and take what they build to production: multi-tenant RAG and MCP platforms, Solr 9 hybrid search, and APIs load-tested with k6.
          </p>
          <div className="ed-actions">
            <Link href="/projects" className="tinted-button">
              Explore work <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/work-with-me" className="ed-link">
              Work with me <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a href="/resume.pdf" download="Boda-Madhukar-Reddy-Resume.pdf" className="ed-link">
              Résumé <FileDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="ed-ticker" aria-hidden>
        <div className="ed-ticker-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="ed-ticker-run">
              {TICKER.map((word) => (
                <span key={word}>
                  {word}
                  <i>✶</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <dl className="ed-metrics">
        {metrics.map(({ value, label }, i) => (
          <div key={label} className="ed-reveal">
            <dt>
              <span>{String(i + 1).padStart(2, '0')}</span>
              {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section className="ed-gallery" aria-labelledby="ed-work">
        <div className="ed-sticky">
          <header className="ed-gallery-head">
            <h2 id="ed-work">Selected work</h2>
            <p>
              {String(projects.length).padStart(2, '0')} projects <span aria-hidden>· scroll →</span>
            </p>
          </header>
          <ol className="ed-track">
            {projects.slice(0, SHOWN).map((project, i) => (
              <li key={project.title}>
                <Link href={projectHref(project)} className="ed-panel">
                  <span className="ed-panel-no">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{project.title}</h3>
                  <p>{project.outcome ?? project.description}</p>
                  <ul className="ed-panel-tech">
                    {project.tech.slice(0, 4).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <span className="ed-panel-go" aria-hidden>
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/projects" className="ed-panel ed-panel-all">
                <span className="ed-panel-no">→</span>
                <h3>All projects</h3>
                <p>Client work, lab experiments and the case studies behind them.</p>
              </Link>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
