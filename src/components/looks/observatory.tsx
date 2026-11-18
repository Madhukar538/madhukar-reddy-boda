import Link from 'next/link';
import { fill } from '@/lib/story-text';
import { InlineText } from '@/components/editorial/inline-text';
import { projectHref, shortDate, type LookHomeProps } from './types';
import { actTitle, type AboutProps, type ExperienceProps, type ProjectsProps } from './pages-types';

/**
 * Observatory: a star atlas. The projects as a constellation (each star links to one), the numbers as
 * magnitudes and the posts as an observation log; inside, epochs, field notes and a star catalogue.
 */

/** Where the stars sit on the chart, in percent: hand-placed so the figure reads as one constellation. */
const STARS = [
  [12, 62], [26, 34], [41, 52], [55, 22], [68, 44], [80, 18], [88, 58], [62, 76],
] as const;

const designation = (i: number) => `DH-${String(i + 1).padStart(3, '0')}`;

export function ObservatoryHome({ heading, name, projects, metrics, since, posts, writing }: LookHomeProps) {
  const shown = projects.slice(0, STARS.length);
  const path = shown.map((_, i) => `${STARS[i][0]},${STARS[i][1]}`).join(' ');
  return (
    <div className="home-observatory look-home">
      <section className="ob-hero" aria-labelledby="ob-title">
        <p id="ob-title" role="heading" aria-level={1} className="sr-only">
          {heading}
        </p>
        <p className="ob-coords" aria-hidden>
          <span>RA 17h 23m · Dec +17° 23′</span>
          <span>Observed since {since}</span>
        </p>
        <p className="ob-name" aria-hidden>
          {name}
        </p>
        <p className="ob-sub">A chart of the systems he has built. Each star is a project: follow the line.</p>
      </section>

      <section className="ob-chart" aria-label="Projects as a constellation">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline points={path} />
        </svg>
        <ul>
          {shown.map((p, i) => (
            <li key={p.title} style={{ left: `${STARS[i][0]}%`, top: `${STARS[i][1]}%` }} className={i % 3 === 0 ? 'ob-bright' : undefined}>
              <Link href={projectHref(p)}>
                <span className="ob-star" aria-hidden />
                <span className="ob-label">
                  <span>{designation(i)}</span>
                  {p.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="ob-split">
        <section className="ob-panel" aria-labelledby="ob-mag">
          <h2 id="ob-mag">Magnitudes</h2>
          <dl>
            {metrics.map((m) => (
              <div key={m.label}>
                <dd>{m.value}</dd>
                <dt>{m.label}</dt>
              </div>
            ))}
          </dl>
        </section>
        <section className="ob-panel" aria-labelledby="ob-log">
          <h2 id="ob-log">Observation log</h2>
          <ol className="ob-log">
            {posts.slice(0, 5).map((p) => (
              <li key={p.slug}>
                <time dateTime={p.date}>{shortDate(p.date)}</time>
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {writing && <ObservatoryCatalogue {...writing} />}
    </div>
  );
}

/**
 * Observatory's writing, past the log and in place of the shared blog list: the older posts as a
 * star catalogue (catalogue number, object, class, date observed) and the topics as constellations.
 */
function ObservatoryCatalogue({ posts, topics, total }: NonNullable<LookHomeProps['writing']>) {
  const objects = posts.slice(5, 11);
  return (
    <section className="ob-panel ob-skycat" aria-labelledby="ob-cat-title">
      <h2 id="ob-cat-title">Star catalogue</h2>
      {objects.length > 0 && (
        <table className="ob-cat">
          <thead>
            <tr>
              <th scope="col">Cat.</th>
              <th scope="col">Object</th>
              <th scope="col" className="ob-hide-sm">
                Class
              </th>
              <th scope="col">Observed</th>
            </tr>
          </thead>
          <tbody>
            {objects.map((p, i) => (
              <tr key={p.slug}>
                <td>DH-{String(total - 5 - i).padStart(3, '0')}</td>
                <td>
                  <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                </td>
                <td className="ob-hide-sm">{p.category}</td>
                <td>{shortDate(p.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {topics.length > 0 && (
        <>
          <h3 className="ob-const-title">Constellations</h3>
          <ul className="ob-const">
            {topics.map((t) => (
              <li key={t.slug}>
                <Link href={`/topics/${t.slug}`} className={t.kind === 'category' ? 'ob-const-cat' : undefined}>
                  <span className="ob-star" aria-hidden />
                  {t.name}
                  <span className="ob-const-n">{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="ob-cat-all">
        <Link href="/blog">The full sky: {total} posts →</Link>
        <Link href="/topics">Every constellation →</Link>
      </p>
    </section>
  );
}

export function ObservatoryExperience({ experience, clientProjects, journey }: ExperienceProps) {
  const groups = [...experience.groups].reverse();
  return (
    <div className="look-only only-observatory ob-page">
      <ol className="ob-epochs">
        {groups.map((g, i) => (
          <li key={g.label}>
            <p className="ob-epoch">Epoch {i + 1} · {g.label}</p>
            <h2>{actTitle(journey, g.label)}</h2>
            <ul>
              {g.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <ObservatorySatellites clientProjects={clientProjects} />
    </div>
  );
}

function ObservatorySatellites({ clientProjects }: { clientProjects: ProjectsProps['clientProjects'] }) {
  return (
    <section className="ob-panel" aria-labelledby="ob-sat">
      <h2 id="ob-sat">Satellites in orbit</h2>
      <ul className="ob-sats">
        {clientProjects.map((c) => (
          <li key={c.id}>
            <span className="ob-orbit" aria-hidden />
            <span>
              <strong>{c.client}</strong>
              <small>
                {c.role} · {c.duration}
              </small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ObservatoryAbout({ name, values, about }: AboutProps) {
  return (
    <div className="look-only only-observatory ob-page ob-notes">
      <p className="ob-epoch">{about?.kicker ?? 'Field notes'}</p>
      <p role="heading" aria-level={1} className="ob-heading">
        <InlineText text={fill(about?.title ?? name, values)} />
      </p>
      {about && <p className="ob-sub">{fill(about.byline, values)}</p>}
      {about?.qa.map(({ q, a }, i) => (
        <section key={q} className="ob-note">
          <p className="ob-epoch">Note {i + 1}</p>
          <h2>{q}</h2>
          <p>
            <InlineText text={fill(a, values)} />
          </p>
        </section>
      ))}
    </div>
  );
}

export function ObservatoryProjects({ keyProjects, clientProjects }: ProjectsProps) {
  return (
    <div className="look-only only-observatory ob-page">
      <section className="ob-panel" aria-labelledby="ob-cat">
        <h2 id="ob-cat">Star catalogue</h2>
        <ol className="ob-catalogue">
          {keyProjects.map((p, i) => (
            <li key={p.title}>
              <Link href={projectHref(p)}>
                <span className="ob-desig">{designation(i)}</span>
                <span className="ob-cat-main">
                  <span className="ob-cat-title">{p.title}</span>
                  <span className="ob-cat-desc">{p.description}</span>
                  {p.outcome && <span className="ob-cat-out">{p.outcome}</span>}
                </span>
                <span className="ob-mag-dots" aria-label={`${p.tech.length} technologies`}>
                  {p.tech.slice(0, 5).map((t) => (
                    <i key={t} title={t} />
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <ObservatorySatellites clientProjects={clientProjects} />
    </div>
  );
}
