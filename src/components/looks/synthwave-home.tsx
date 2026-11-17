import Link from 'next/link';
import { projectHref, shortDate, type LookHomeProps } from './types';

/**
 * Synthwave's homepage: a tape playing on an old TV. The intro on a CRT with its on-screen display,
 * the projects as a shelf of cassettes, the numbers as an arcade high-score table, and the latest
 * posts as tonight's TV guide.
 */

const TAPE_TONES = ['sw-t1', 'sw-t2', 'sw-t3', 'sw-t4'];
const RANKS = ['1ST', '2ND', '3RD', '4TH', '5TH'];

export function SynthwaveHome({ heading, name, projects, metrics, since, posts }: LookHomeProps) {
  return (
    <div className="home-synthwave look-home">
      <section className="sw-tv" aria-labelledby="sw-title">
        <p id="sw-title" role="heading" aria-level={1} className="sr-only">
          {heading}
        </p>
        <div className="sw-screen">
          <p className="sw-osd" aria-hidden>
            <span>▶ PLAY</span>
            <span>CH 03</span>
          </p>
          <p className="sw-name" aria-hidden>
            {name}
          </p>
          <p className="sw-tagline">
            Fast .NET systems, shipped with <em>teams of AI agents</em>.
          </p>
          <p className="sw-osd sw-osd-foot" aria-hidden>
            <span>SP</span>
            <span>REC {since.toUpperCase()}</span>
          </p>
        </div>
        <div className="sw-tv-controls" aria-hidden>
          <span />
          <span />
          <i />
        </div>
      </section>

      <section className="sw-shelf" aria-labelledby="sw-shelf-title">
        <h2 id="sw-shelf-title">The tape shelf</h2>
        <ul>
          {projects.slice(0, 6).map((p, i) => (
            <li key={p.title}>
              <Link href={projectHref(p)} className={`sw-tape ${TAPE_TONES[i % TAPE_TONES.length]}`}>
                <span className="sw-tape-label">
                  <span className="sw-tape-side">SIDE {i % 2 ? 'B' : 'A'} · C-90</span>
                  <span className="sw-tape-title">{p.title}</span>
                </span>
                <span className="sw-tape-window" aria-hidden>
                  <i />
                  <i />
                </span>
                <span className="sw-tape-tech">{p.tech.slice(0, 3).join(' / ')}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/projects" className="sw-link">
          ▶ Play all tapes
        </Link>
      </section>

      <div className="sw-split">
        <section className="sw-scores" aria-labelledby="sw-scores-title">
          <h2 id="sw-scores-title">High scores</h2>
          <dl>
            {metrics.map((m, i) => (
              <div key={m.label}>
                <span aria-hidden>{RANKS[i]}</span>
                <dd>{m.value}</dd>
                <dt>{m.label}</dt>
              </div>
            ))}
          </dl>
          <p className="sw-insert" aria-hidden>
            INSERT COIN
          </p>
        </section>

        <section className="sw-guide" aria-labelledby="sw-guide-title">
          <h2 id="sw-guide-title">Tonight on CH 03</h2>
          <ol>
            {posts.slice(0, 5).map((p) => (
              <li key={p.slug}>
                <time dateTime={p.date}>{shortDate(p.date)}</time>
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
