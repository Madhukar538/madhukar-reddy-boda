import Link from 'next/link';
import { projectHref, shortDate, type LookHomeProps } from './types';

/**
 * Dune's homepage: a book. A title page, an epigraph, a contents page with dot leaders, then the
 * chapters: selected work as numbered entries with notes in the margin, the figures as a table, and
 * recent writing. It closes with a colophon, the way books do.
 */

const ROMAN = ['I', 'II', 'III', 'IV'];

export function DuneHome({ heading, name, projects, metrics, since, posts, writing }: LookHomeProps) {
  const year = Number(since.match(/\d{4}/)?.[0] ?? 2021);
  const contents = [
    { title: 'Selected work', href: '#dune-work', page: `${Math.min(projects.length, 5)} entries` },
    { title: 'Figures', href: '#dune-figures', page: `${metrics.length} figures` },
    { title: 'Recent writing', href: '#dune-writing', page: `${writing ? writing.total : Math.min(posts.length, 4)} essays` },
    { title: 'The full story', href: '/experience', page: 'continued' },
  ];
  return (
    <div className="home-dune look-home">
      <section className="du-title" aria-labelledby="du-title">
        <p id="du-title" role="heading" aria-level={1} className="sr-only">
          {heading}
        </p>
        <p className="du-kicker" aria-hidden>
          A field book of systems
        </p>
        <p className="du-name" aria-hidden>
          {name}
        </p>
        <p className="du-ornament" aria-hidden>
          ❦
        </p>
        <p className="du-imprint" aria-hidden>
          Hyderabad · {toRoman(year)}–
        </p>
      </section>

      <blockquote className="du-epigraph">
        <p>Make it work, make it right, make it fast, and then hand the boring parts to the agents.</p>
        <footer>— a working rule</footer>
      </blockquote>

      <nav className="du-contents" aria-labelledby="du-contents-title">
        <h2 id="du-contents-title">Contents</h2>
        <ol>
          {contents.map((c, i) => (
            <li key={c.title}>
              <Link href={c.href}>
                <span className="du-num">{ROMAN[i]}</span>
                <span className="du-entry">{c.title}</span>
                <span className="du-leader" aria-hidden />
                <span className="du-pg">{c.page}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <section id="dune-work" className="du-chapter" aria-labelledby="du-work-title">
        <p className="du-chapter-no" aria-hidden>
          Chapter I
        </p>
        <h2 id="du-work-title">Selected work</h2>
        <ol className="du-entries">
          {projects.slice(0, 5).map((p, i) => (
            <li key={p.title}>
              <div>
                <h3>
                  <span className="du-entry-no">{i + 1}.</span> <Link href={projectHref(p)}>{p.title}</Link>
                </h3>
                <p>{p.description}</p>
                <p className="du-tech">{p.tech.slice(0, 4).join(', ')}</p>
              </div>
              {p.outcome && <aside className="du-note">{p.outcome}</aside>}
            </li>
          ))}
        </ol>
        <Link href="/projects" className="du-more">
          Continued in Projects →
        </Link>
      </section>

      <section id="dune-figures" className="du-chapter" aria-labelledby="du-figures-title">
        <p className="du-chapter-no" aria-hidden>
          Chapter II
        </p>
        <h2 id="du-figures-title">Figures</h2>
        <dl className="du-figures">
          {metrics.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <span className="du-leader" aria-hidden />
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="dune-writing" className="du-chapter" aria-labelledby="du-writing-title">
        <p className="du-chapter-no" aria-hidden>
          Chapter III
        </p>
        <h2 id="du-writing-title">Recent writing</h2>
        {writing?.posts[0] && (
          <Link href={`/blog/${writing.posts[0].slug}`} className="du-lead">
            <span className="du-lead-kicker">
              The latest · {writing.posts[0].category} · {writing.posts[0].readTime}
            </span>
            <span className="du-lead-title">{writing.posts[0].title}</span>
            <span className="du-lead-excerpt">{writing.posts[0].excerpt}</span>
          </Link>
        )}
        <ol className="du-writing">
          {(writing ? writing.posts.slice(1, 10) : posts.slice(0, 4)).map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              <time dateTime={p.date}>{shortDate(p.date)}</time>
            </li>
          ))}
        </ol>
        {writing && (
          <>
            <h3 className="du-index-title">Index</h3>
            <ul className="du-index">
              {[...writing.topics]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <li key={t.slug}>
                    <Link href={`/topics/${t.slug}`} className={t.kind === 'category' ? 'du-index-cat' : undefined}>
                      {t.name}
                    </Link>
                    <span className="du-leader" aria-hidden />
                    <span className="du-index-n">{t.count}</span>
                  </li>
                ))}
            </ul>
            <p className="du-more">
              <Link href="/blog">All {writing.total} essays →</Link>
            </p>
          </>
        )}
      </section>

      <p className="du-colophon">
        <span>Colophon.</span> Set in Instrument Serif and Inter, on sand. Built in .NET and Next.js, and printed fresh on every visit.
      </p>
    </div>
  );
}

function toRoman(n: number) {
  const table: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
  return out;
}
