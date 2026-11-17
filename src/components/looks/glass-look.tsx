import Link from 'next/link';
import { fill } from '@/lib/story-text';
import { InlineText } from '@/components/editorial/inline-text';
import { projectHref, shortDate, type LookHomeProps } from './types';
import { actTitle, type AboutProps, type ExperienceProps, type ProjectsProps } from './pages-types';

/**
 * Glass: a device's home screen in frosted glass. Widgets for the numbers, an app grid for the
 * projects and notifications for the posts; inside, grouped notifications for the experience, a
 * message thread for About and app pages for the projects.
 */

const TINTS = ['gl-t1', 'gl-t2', 'gl-t3', 'gl-t4', 'gl-t5', 'gl-t6'];
const initials = (s: string) =>
  s
    .split(/[\s:&-]+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export function GlassHome({ heading, name, projects, metrics, since, posts }: LookHomeProps) {
  return (
    <div className="home-glass look-home">
      <p id="gl-title" role="heading" aria-level={1} className="sr-only">
        {heading}
      </p>
      <section className="gl-lock" aria-hidden>
        <p className="gl-date">Hyderabad · since {since}</p>
        <p className="gl-name">{name}</p>
      </section>
      <div className="gl-widgets">
        {metrics.map((m) => (
          <div key={m.label} className="gl-widget glass glass-strong">
            <p className="gl-widget-label">{m.label}</p>
            <p className="gl-widget-value">{m.value}</p>
          </div>
        ))}
      </div>
      <section aria-label="Projects" className="gl-apps">
        {projects.slice(0, 8).map((p, i) => (
          <Link key={p.title} href={projectHref(p)} className="gl-app">
            <span className={`gl-icon ${TINTS[i % TINTS.length]}`} aria-hidden>
              {initials(p.title)}
            </span>
            <span className="gl-app-name">{p.title}</span>
          </Link>
        ))}
      </section>
      <section aria-label="Latest posts" className="gl-notes">
        {posts.slice(0, 3).map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="gl-note glass glass-strong">
            <span className="gl-note-head">
              <span className="gl-icon gl-icon-sm gl-t1" aria-hidden>
                B
              </span>
              <span>Blog</span>
              <time dateTime={p.date}>{shortDate(p.date)}</time>
            </span>
            <span className="gl-note-title">{p.title}</span>
            <span className="gl-note-body">{p.excerpt}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

export function GlassExperience({ experience, clientProjects, journey }: ExperienceProps) {
  const groups = [...experience.groups].reverse();
  return (
    <div className="look-only only-glass gl-page">
      {groups.map((g, i) => (
        <section key={g.label} className="gl-stack" aria-labelledby={`gl-exp-${i}`}>
          <h2 id={`gl-exp-${i}`}>
            <span className={`gl-icon gl-icon-sm ${TINTS[i % TINTS.length]}`} aria-hidden>
              {initials(g.label)}
            </span>
            {actTitle(journey, g.label)}
            <span className="gl-count">{g.items.length}</span>
          </h2>
          <ul>
            {g.items.map((item) => (
              <li key={item} className="glass glass-strong">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <GlassSettings clientProjects={clientProjects} />
    </div>
  );
}

function GlassSettings({ clientProjects }: { clientProjects: ProjectsProps['clientProjects'] }) {
  return (
    <section className="gl-list glass glass-strong" aria-labelledby="gl-clients">
      <h2 id="gl-clients">Clients</h2>
      <ul>
        {clientProjects.map((c, i) => (
          <li key={c.id}>
            <span className={`gl-icon gl-icon-sm ${TINTS[i % TINTS.length]}`} aria-hidden>
              {initials(c.client)}
            </span>
            <span className="gl-list-main">
              <strong>{c.client}</strong>
              <small>{c.role}</small>
            </span>
            <span className="gl-list-side">{c.duration}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GlassAbout({ name, values, about }: AboutProps) {
  return (
    <div className="look-only only-glass gl-page gl-thread">
      <header className="gl-thread-head">
        <span className="gl-avatar" aria-hidden>
          {initials(name)}
        </span>
        <p role="heading" aria-level={1} className="gl-thread-title">
          <InlineText text={fill(about?.title ?? name, values)} />
        </p>
        {about && <p className="gl-thread-by">{fill(about.byline, values)}</p>}
      </header>
      {about && (
        <ol className="gl-bubbles">
          {about.qa.map(({ q, a }) => (
            <li key={q}>
              <p className="gl-bubble gl-bubble-q">{q}</p>
              <p className="gl-bubble gl-bubble-a">
                <InlineText text={fill(a, values)} />
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function GlassProjects({ keyProjects, clientProjects }: ProjectsProps) {
  return (
    <div className="look-only only-glass gl-page">
      <ul className="gl-store">
        {keyProjects.map((p, i) => (
          <li key={p.title}>
            <Link href={projectHref(p)} className="gl-card glass glass-strong glass-interactive">
              <span className="gl-card-head">
                <span className={`gl-icon ${TINTS[i % TINTS.length]}`} aria-hidden>
                  {initials(p.title)}
                </span>
                <span>
                  <span className="gl-card-title">{p.title}</span>
                  <span className="gl-card-sub">{p.tech.slice(0, 3).join(' · ')}</span>
                </span>
                <span className="gl-get">Open</span>
              </span>
              <span className="gl-card-desc">{p.description}</span>
              {p.outcome && <span className="gl-card-out">{p.outcome}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <GlassSettings clientProjects={clientProjects} />
    </div>
  );
}
