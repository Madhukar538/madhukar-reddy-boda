import Link from 'next/link';
import { ArrowRight, ArrowUpRight, FileDown } from 'lucide-react';
import type { ProjectCard } from '@/data/profile';
import { caseStudyFor } from '@/data/case-studies';
import { EditorialStory } from './editorial-story';
import { EditorialNext } from './editorial-next';
import { EditorialAgentMap } from './editorial-agent-map';
import { InlineText } from './inline-text';
import { TickerMark } from './ticker-icons';
import type { Story } from '@/lib/story';

/**
 * The Editorial look's homepage: a kinetic name, a running ticker, the numbers, the journey and a
 * sideways gallery of projects, all from the site's story (lib/story.ts) and content. It is in the page for every look but only shown in
 * Editorial (globals.css), so switching looks needs no new request. The moving parts are
 * components/editorial/editorial-fx.tsx; without them this is a still, readable page.
 */

/** Panels in the sideways gallery before the "All projects" one: enough to show range, short enough to scroll. */
const SHOWN = 6;

type Metric = { value: React.ReactNode; label: string };

function projectHref(project: ProjectCard) {
  const study = caseStudyFor(project.title);
  if (study) return `/projects/${study.slug}`;
  return project.post ? `/blog/${project.post}` : '/projects';
}

export function EditorialHome({ projects, metrics, since, story }: { projects: ProjectCard[]; metrics: Metric[]; since: string; story: Story }) {
  const { hero, ticker } = story;
  return (
    <div className="home-editorial">
      <section className="ed-hero" aria-labelledby="ed-title">
        {/* A heading for screen readers in this look; a role rather than a second <h1> in the page's HTML
            (the other looks' <h1> is in the same page, hidden here). */}
        <p id="ed-title" role="heading" aria-level={1} className="sr-only">
          {hero.heading}
        </p>
        <p className="ed-meta" aria-hidden>
          {hero.meta.map((m) => (
            <span key={m}>{m}</span>
          ))}
          <span>{since} →</span>
        </p>
        {/* The name, with a short index of who and where on the right, over a rule. */}
        <div className="ed-stage">
          {hero.showAgentMap && <EditorialAgentMap />}
          <div className="ed-aside">
          {/* A slowly turning badge: what he does, round an orange button to send him a bug. */}
          <Link href="/fix-a-bug" className="ed-badge" aria-label="Send me a bug">
            <svg viewBox="0 0 200 200" aria-hidden>
              <defs>
                <path id="ed-badge-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
              </defs>
              <text>
                <textPath href="#ed-badge-ring" textLength="500" lengthAdjust="spacing">
                  {hero.badge}
                </textPath>
              </text>
            </svg>
            <span className="ed-badge-core" aria-hidden>
              <ArrowUpRight />
            </span>
          </Link>
          <dl className="ed-index" aria-hidden>
            {hero.index.map(({ label, value }, i) => (
              <div key={label}>
                <dt>({String(i + 1).padStart(2, '0')}) {label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          </div>
        <div className="ed-name" aria-hidden>
          {hero.nameLines.map((line, l) => (
            <span key={line} className="ed-line" data-line={l}>
              {Array.from(line).map((ch, i) => (
                <span key={i} className="ed-char" style={{ '--i': l * 6 + i } as React.CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </div>
        </div>
        <div className="ed-intro">
          <p className="ed-lede" aria-hidden>
            <InlineText text={hero.lede} />
          </p>
          <p className="ed-body">{hero.body}</p>
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
              {ticker.map(({ label, icon }) => (
                <span key={label}>
                  <TickerMark icon={icon} />
                  {label}
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

      <EditorialStory story={story.story} />

      <section className="ed-gallery" aria-labelledby="ed-work">
        <div className="ed-sticky">
          <header className="ed-gallery-head">
            <h2 id="ed-work">The evidence</h2>
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

      <div className="ed-home-next">
        <EditorialNext from="/" />
      </div>
    </div>
  );
}
