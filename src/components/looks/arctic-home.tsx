import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { projectHref, shortDate, type LookHomeProps } from './types';

/**
 * Arctic's homepage: a railway station. Line badges for what he works in, the projects on a
 * departures board (amber dot-matrix on black), the numbers as platform signs, and the latest posts
 * as the next departures.
 */

const LINES = [
  { code: 'N', label: '.NET', tone: 'ar-l1' },
  { code: 'A', label: 'AI agents', tone: 'ar-l2' },
  { code: 'R', label: 'RAG', tone: 'ar-l3' },
  { code: 'M', label: 'MCP', tone: 'ar-l4' },
];

/** A topic's line colour: each category gets one of the four, in the order the topics list them. */
const toneFor = (writing: NonNullable<LookHomeProps['writing']>, category: string) => {
  const categories = writing.topics.filter((t) => t.kind === 'category').map((t) => t.name);
  const i = categories.indexOf(category);
  return LINES[(i < 0 ? 0 : i) % LINES.length].tone;
};

export function ArcticHome({ heading, name, projects, metrics, since, posts, writing }: LookHomeProps) {
  return (
    <div className="home-arctic look-home">
      <section className="ar-hero" aria-labelledby="ar-title">
        <p id="ar-title" role="heading" aria-level={1} className="sr-only">
          {heading}
        </p>
        <p className="ar-station" aria-hidden>
          <span>Hyderabad</span>
          <span>In service since {since}</span>
        </p>
        <p className="ar-name" aria-hidden>
          {name}
        </p>
        <ul className="ar-lines" aria-label="Lines">
          {LINES.map((l) => (
            <li key={l.code}>
              <span className={`ar-line-badge ${l.tone}`} aria-hidden>
                {l.code}
              </span>
              {l.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="ar-board" aria-labelledby="ar-board-title">
        <header className="ar-board-head">
          <h2 id="ar-board-title">Departures</h2>
          <span aria-hidden>Projects · all on time</span>
        </header>
        <table>
          <thead>
            <tr>
              <th scope="col">Plat.</th>
              <th scope="col">Destination</th>
              <th scope="col" className="ar-hide-sm">Calling at</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.slice(0, 8).map((p, i) => (
              <tr key={p.title}>
                <td className="ar-plat">{String(i + 1).padStart(2, '0')}</td>
                <td>
                  <Link href={projectHref(p)}>{p.title}</Link>
                </td>
                <td className="ar-hide-sm ar-via">{p.tech.slice(0, 3).join(' · ')}</td>
                <td className="ar-status">{p.outcome ? 'Delivered' : 'In service'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link href="/projects" className="ar-board-more">
          Full timetable <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <dl className="ar-signs">
        {metrics.map((m, i) => (
          <div key={m.label} className="ar-sign">
            <span className="ar-sign-no" aria-hidden>
              {i + 1}
            </span>
            <dd>{m.value}</dd>
            <dt>{m.label}</dt>
          </div>
        ))}
      </dl>

      <section className="ar-next" aria-labelledby="ar-next-title">
        <h2 id="ar-next-title">Next departures</h2>
        <ol>
          {(writing?.posts ?? posts).slice(0, writing ? 10 : 4).map((p) => (
            <li key={p.slug}>
              <time dateTime={p.date}>{shortDate(p.date)}</time>
              <span className="ar-next-main">
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                {writing && (
                  <span className="ar-next-line">
                    <span className={`ar-line-badge ar-line-sm ${toneFor(writing, p.category)}`} aria-hidden>
                      {p.category[0]}
                    </span>
                    {p.category}
                  </span>
                )}
              </span>
              <span className="ar-via">{p.readTime}</span>
            </li>
          ))}
        </ol>
        {writing && (
          <>
            <h3 className="ar-net-title">Network map</h3>
            <ul className="ar-net" aria-label="Topics">
              {writing.topics.map((t) => (
                <li key={t.slug}>
                  <Link href={`/topics/${t.slug}`} className={t.kind === 'category' ? 'ar-net-cat' : undefined}>
                    {t.kind === 'category' && (
                      <span className={`ar-line-badge ar-line-sm ${toneFor(writing, t.name)}`} aria-hidden>
                        {t.name[0]}
                      </span>
                    )}
                    {t.name}
                    <span className="ar-net-n">{t.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="ar-next-all">
              <Link href="/blog">All {writing.total} departures →</Link>
              <Link href="/topics">Every line →</Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
