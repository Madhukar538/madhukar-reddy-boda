import Link from 'next/link';
import { fill } from '@/lib/story-text';
import { InlineText } from '@/components/editorial/inline-text';
import { projectHref } from './types';
import { actTitle, type AboutProps, type ExperienceProps, type ProjectsProps } from './pages-types';

/** Synthwave's inner pages: a mixtape's tracklist, an interview tape and a video rental shelf. */

const TONES = ['sw-t1', 'sw-t2', 'sw-t3', 'sw-t4'];
const stamp = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

/** Experience: each part of the work is a track (side A from the start), its achievements the liner notes; clients as an episode guide. */
export function SynthwaveExperience({ experience, clientProjects, journey }: ExperienceProps) {
  const groups = [...experience.groups].reverse();
  return (
    <div className="look-only only-synthwave sw-page">
      <section className="sw-tracklist" aria-label="Tracklist">
        {groups.map((g, i) => (
          <article key={g.label} className={TONES[i % TONES.length]}>
            <header>
              <span className="sw-track-no" aria-hidden>
                {i < 2 ? 'A' : 'B'}
                {(i % 2) + 1}
              </span>
              <h2>{actTitle(journey, g.label)}</h2>
              <span className="sw-track-len" aria-hidden>
                {g.items.length}:{String((g.items.length * 17) % 60).padStart(2, '0')}
              </span>
            </header>
            <ul>
              {g.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <section className="sw-guide sw-episodes" aria-labelledby="sw-ep-title">
        <h2 id="sw-ep-title">Episode guide</h2>
        <ol>
          {clientProjects.map((c, i) => (
            <li key={c.id}>
              <time>S01E{String(i + 1).padStart(2, '0')}</time>
              <div>
                <p className="sw-ep-title">{c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.client}</a> : c.client}</p>
                <p className="sw-ep-meta">
                  {c.role} · {c.duration}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/** About: the interview, as a tape transcript with a counter on each line. */
export function SynthwaveAbout({ name, values, about }: AboutProps) {
  let clock = 12;
  return (
    <div className="look-only only-synthwave sw-page">
      <header className="sw-label-card">
        <p className="sw-tape-side">INTERVIEW · SIDE A · {about?.kicker ?? 'About'}</p>
        <p role="heading" aria-level={1} className="sw-label-title">
          <InlineText text={fill(about?.title ?? name, values)} />
        </p>
        {about && <p className="sw-label-by">{fill(about.byline, values)}</p>}
      </header>
      {about && (
        <dl className="sw-transcript">
          {about.qa.map(({ q, a }) => {
            const asked = stamp(clock);
            const answered = stamp(clock + 9);
            clock += 9 + Math.ceil(a.length / 6);
            return (
              <div key={q}>
                <dt>
                  <span aria-hidden>[{asked}] Q</span>
                  {q}
                </dt>
                <dd>
                  <span aria-hidden>[{answered}] A</span>
                  <InlineText text={fill(a, values)} />
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}

/** Projects: a video rental shelf, one box per project; clients as the rental ledger. */
export function SynthwaveProjects({ keyProjects, clientProjects }: ProjectsProps) {
  return (
    <div className="look-only only-synthwave sw-page">
      <ul className="sw-boxes">
        {keyProjects.map((p, i) => (
          <li key={p.title}>
            <Link href={projectHref(p)} className={`sw-box ${TONES[i % TONES.length]}`}>
              <span className="sw-box-top">
                <span>{p.tech[0]}</span>
                <span>{p.featured ? 'NEW RELEASE' : 'STAFF PICK'}</span>
              </span>
              <span className="sw-box-title">{p.title}</span>
              <span className="sw-box-desc">{p.description}</span>
              <span className="sw-box-foot">
                <span>VHS</span>
                <span>{p.tech.slice(1, 3).join(' · ')}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="sw-scores sw-ledger" aria-labelledby="sw-ledger-title">
        <h2 id="sw-ledger-title">Rental ledger</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Client</th>
              <th scope="col" className="sw-hide-sm">Role</th>
              <th scope="col">Out</th>
            </tr>
          </thead>
          <tbody>
            {clientProjects.map((c) => (
              <tr key={c.id}>
                <td>{c.client}</td>
                <td className="sw-hide-sm">{c.role}</td>
                <td>{c.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
