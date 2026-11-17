import Link from 'next/link';
import { fill } from '@/lib/story-text';
import { InlineText } from '@/components/editorial/inline-text';
import { projectHref } from './types';
import { actTitle, type AboutProps, type ExperienceProps, type ProjectsProps } from './pages-types';

/** Arctic's inner pages: a station's route map, information desk and network of lines. */

/** Route colours (globals.css --line); not the homepage's ar-l* badge classes, which fill the background. */
const TONES = ['ar-tone-1', 'ar-tone-2', 'ar-tone-3', 'ar-tone-4'];
const CODES = ['N', 'A', 'R', 'M', 'P', 'E'];

/** Experience: each part of the work is a line, its achievements the stops along it; clients as a timetable. */
export function ArcticExperience({ experience, clientProjects, journey }: ExperienceProps) {
  const groups = [...experience.groups].reverse();
  return (
    <div className="look-only only-arctic ar-page">
      <section aria-label="Route map">
        {groups.map((g, i) => (
          <div key={g.label} className={`ar-route ${TONES[i % TONES.length]}`}>
            <header>
              <span className="ar-line-badge" aria-hidden>
                {CODES[i % CODES.length]}
              </span>
              <h2>{actTitle(journey, g.label)}</h2>
              <span className="ar-route-meta">{g.label} · {g.items.length} stops</span>
            </header>
            <ol>
              {g.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        ))}
      </section>
      <ArcticTimetable clientProjects={clientProjects} title="Client services" />
    </div>
  );
}

function ArcticTimetable({ clientProjects, title }: { clientProjects: ProjectsProps['clientProjects']; title: string }) {
  return (
    <section className="ar-board ar-timetable" aria-labelledby="ar-tt-title">
      <header className="ar-board-head">
        <h2 id="ar-tt-title">{title}</h2>
        <span aria-hidden>{clientProjects.length} services</span>
      </header>
      <table>
        <thead>
          <tr>
            <th scope="col">Years</th>
            <th scope="col">Client</th>
            <th scope="col" className="ar-hide-sm">Role</th>
          </tr>
        </thead>
        <tbody>
          {clientProjects.map((c) => (
            <tr key={c.id}>
              <td className="ar-plat">{c.duration.replace(/\s/g, '')}</td>
              <td>{c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.client}</a> : <span className="ar-dest">{c.client}</span>}</td>
              <td className="ar-hide-sm ar-via">{c.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** About: the station's information desk, one numbered sign per question. */
export function ArcticAbout({ name, values, about }: AboutProps) {
  return (
    <div className="look-only only-arctic ar-page ar-about">
      <header className="ar-desk">
        <span className="ar-desk-i" aria-hidden>
          i
        </span>
        <div>
          <p className="eyebrow">{about?.kicker ?? 'Information'}</p>
          <p role="heading" aria-level={1} className="ar-desk-title">
            <InlineText text={fill(about?.title ?? name, values)} />
          </p>
          {about && <p className="ar-desk-by">{fill(about.byline, values)}</p>}
        </div>
      </header>
      {about && (
        <dl className="ar-signs-qa">
          {about.qa.map(({ q, a }, i) => (
            <div key={q}>
              <dt>
                <span aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                {q}
              </dt>
              <dd>
                <InlineText text={fill(a, values)} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** Projects: the network, one route card per project with its stack as the stops; clients as a timetable. */
export function ArcticProjects({ keyProjects, clientProjects }: ProjectsProps) {
  return (
    <div className="look-only only-arctic ar-page">
      <ul className="ar-network">
        {keyProjects.map((p, i) => (
          <li key={p.title} className={TONES[i % TONES.length]}>
            <Link href={projectHref(p)} className="ar-card">
              <span className="ar-card-head">
                <span className="ar-line-badge" aria-hidden>
                  {String(i + 1)}
                </span>
                <span className="ar-card-title">{p.title}</span>
              </span>
              <span className="ar-card-desc">{p.description}</span>
              <span className="ar-stops" aria-label="Stack">
                {p.tech.slice(0, 5).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <ArcticTimetable clientProjects={clientProjects} title="Client services" />
    </div>
  );
}
