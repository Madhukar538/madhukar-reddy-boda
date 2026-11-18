import Link from 'next/link';
import { fill } from '@/lib/story-text';
import { InlineText } from '@/components/editorial/inline-text';
import { projectHref, shortDate, type LookHomeProps } from './types';
import { actTitle, type AboutProps, type ExperienceProps, type ProjectsProps } from './pages-types';

/**
 * Blueprint: drawing sheets. Each page is a sheet in a frame with zone marks and a title block; the
 * projects are a parts list, the numbers dimensioned callouts, the experience a revision history,
 * About the general notes and Projects a set of detail views.
 */

function Sheet({ title, sheet, children }: { title: string; sheet: string; children: React.ReactNode }) {
  return (
    <div className="bs-sheet">
      <div className="bs-zones bs-zones-top" aria-hidden>
        {['1', '2', '3', '4', '5', '6'].map((z) => (
          <span key={z}>{z}</span>
        ))}
      </div>
      <div className="bs-inner">{children}</div>
      <table className="bs-title" aria-label="Title block">
        <tbody>
          <tr>
            <th scope="row">Title</th>
            <td colSpan={3}>{title}</td>
          </tr>
          <tr>
            <th scope="row">Drawn</th>
            <td>B. M. Reddy</td>
            <th scope="row">Sheet</th>
            <td>{sheet}</td>
          </tr>
          <tr>
            <th scope="row">Scale</th>
            <td>1 : 1</td>
            <th scope="row">Rev</th>
            <td>{new Date().getFullYear()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function BlueprintHome({ heading, name, projects, metrics, since, posts, writing }: LookHomeProps) {
  return (
    <div className="home-blueprint look-home">
      <p id="bs-title" role="heading" aria-level={1} className="sr-only">
        {heading}
      </p>
      <Sheet title={`${name}: general arrangement`} sheet="1 of 4">
        <p className="bs-label">General arrangement · in service since {since}</p>
        <p className="bs-name" aria-hidden>
          {name}
        </p>
        <dl className="bs-dims">
          {metrics.map((m) => (
            <div key={m.label}>
              <dd>
                <span className="bs-dim-line" aria-hidden />
                {m.value}
                <span className="bs-dim-line" aria-hidden />
              </dd>
              <dt>{m.label}</dt>
            </div>
          ))}
        </dl>
        <h2 className="bs-h">Parts list</h2>
        <table className="bs-parts">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Part</th>
              <th scope="col" className="bs-hide-sm">Material</th>
              <th scope="col">Qty</th>
            </tr>
          </thead>
          <tbody>
            {projects.slice(0, 8).map((p, i) => (
              <tr key={p.title}>
                <td>{i + 1}</td>
                <td>
                  <Link href={projectHref(p)}>{p.title}</Link>
                </td>
                <td className="bs-hide-sm">{p.tech.slice(0, 2).join(', ')}</td>
                <td>1</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!writing && (
          <>
            <h2 className="bs-h">Notes</h2>
            <ol className="bs-notes">
              {posts.slice(0, 4).map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`}>{p.title}</Link> <span className="bs-dim">({shortDate(p.date)})</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </Sheet>
      {writing && <BlueprintWriting {...writing} />}
    </div>
  );
}

const issued = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

/**
 * Blueprint's writing, in place of the shared blog list: a second sheet, the drawing register. The
 * two newest posts are detail views, the rest rows of the register (drawing number, title,
 * discipline, issue date), and the topics a legend of keynotes with their post counts.
 */
function BlueprintWriting({ posts, topics, total }: NonNullable<LookHomeProps['writing']>) {
  if (posts.length === 0) return null;
  const views = posts.slice(0, 2);
  const register = posts.slice(2, 10);
  const dwg = (i: number) => `W-${String(total - i).padStart(3, '0')}`;
  return (
    <section aria-labelledby="bs-writing-title" className="bs-writing">
      <Sheet title="Writing: drawing register" sheet="1A of 4">
        <p className="bs-label">Drawing register · {total} issued</p>
        <h2 id="bs-writing-title" className="bs-name bs-name-sm">
          Writing
        </h2>
        <div className="bs-views bs-writing-views">
          {views.map((p, i) => (
            <Link key={p.slug} href={`/blog/${p.slug}`}>
              <span className="bs-view-out">
                Detail {String.fromCharCode(65 + i)} · {dwg(i)} · {p.category}
              </span>
              <span className="bs-view-title">{p.title}</span>
              <span className="bs-view-desc">{p.excerpt}</span>
              <span className="bs-dim">
                Issued {issued(p.date)} · {p.readTime}
              </span>
            </Link>
          ))}
        </div>
        {register.length > 0 && (
          <>
            <h3 className="bs-h">Register</h3>
            <table className="bs-parts bs-register">
              <thead>
                <tr>
                  <th scope="col">Dwg</th>
                  <th scope="col">Title</th>
                  <th scope="col" className="bs-hide-sm">
                    Discipline
                  </th>
                  <th scope="col">Issued</th>
                </tr>
              </thead>
              <tbody>
                {register.map((p, i) => (
                  <tr key={p.slug}>
                    <td>{dwg(i + 2)}</td>
                    <td>
                      <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                    </td>
                    <td className="bs-hide-sm">{p.category}</td>
                    <td>{issued(p.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {topics.length > 0 && (
          <>
            <h3 className="bs-h">Keynotes</h3>
            <ul className="bs-keys">
              {topics.map((t) => (
                <li key={t.slug}>
                  <Link href={`/topics/${t.slug}`} className={t.kind === 'category' ? 'bs-key-cat' : undefined}>
                    <span className="bs-key-n">{t.count}</span>
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="bs-writing-links">
          <Link href="/blog">Full register: all {total} posts →</Link>
          <Link href="/topics">Every topic →</Link>
        </p>
      </Sheet>
    </section>
  );
}

export function BlueprintExperience({ experience, clientProjects, journey }: ExperienceProps) {
  const groups = [...experience.groups].reverse();
  return (
    <div className="look-only only-blueprint bs-page">
      <Sheet title="Revision history" sheet="2 of 4">
        {groups.map((g, i) => (
          <section key={g.label} className="bs-detail">
            <p className="bs-label">
              Detail {String.fromCharCode(65 + i)} · {g.label}
            </p>
            <h2 className="bs-h">{actTitle(journey, g.label)}</h2>
            <ol className="bs-notes">
              {g.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
        ))}
        <h2 className="bs-h">Revision table</h2>
        <BlueprintRevisions clientProjects={clientProjects} />
      </Sheet>
    </div>
  );
}

function BlueprintRevisions({ clientProjects }: { clientProjects: ProjectsProps['clientProjects'] }) {
  return (
    <table className="bs-parts">
      <thead>
        <tr>
          <th scope="col">Rev</th>
          <th scope="col">Client</th>
          <th scope="col" className="bs-hide-sm">Description</th>
          <th scope="col">Date</th>
        </tr>
      </thead>
      <tbody>
        {clientProjects.map((c, i) => (
          <tr key={c.id}>
            <td>{String.fromCharCode(65 + (i % 26))}</td>
            <td>{c.client}</td>
            <td className="bs-hide-sm">{c.role}</td>
            <td>{c.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function BlueprintAbout({ name, values, about }: AboutProps) {
  return (
    <div className="look-only only-blueprint bs-page">
      <Sheet title="General notes" sheet="3 of 4">
        <p className="bs-label">{about?.kicker ?? 'About'}</p>
        <p role="heading" aria-level={1} className="bs-name bs-name-sm">
          <InlineText text={fill(about?.title ?? name, values)} />
        </p>
        {about && <p className="bs-dim">{fill(about.byline, values)}</p>}
        {about && (
          <ol className="bs-gn">
            {about.qa.map(({ q, a }) => (
              <li key={q}>
                <h2>{q}</h2>
                <p>
                  <InlineText text={fill(a, values)} />
                </p>
              </li>
            ))}
          </ol>
        )}
      </Sheet>
    </div>
  );
}

export function BlueprintProjects({ keyProjects, clientProjects }: ProjectsProps) {
  return (
    <div className="look-only only-blueprint bs-page">
      <Sheet title="Assemblies" sheet="4 of 4">
        <ul className="bs-views">
          {keyProjects.map((p, i) => (
            <li key={p.title}>
              <Link href={projectHref(p)}>
                <span className="bs-label">
                  Section {String.fromCharCode(65 + i)}–{String.fromCharCode(65 + i)}
                </span>
                <span className="bs-view-title">{p.title}</span>
                <span className="bs-view-desc">{p.description}</span>
                {p.outcome && <span className="bs-view-out">Tolerance: {p.outcome}</span>}
                <span className="bs-dim">{p.tech.slice(0, 4).join(' · ')}</span>
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="bs-h">Revision table</h2>
        <BlueprintRevisions clientProjects={clientProjects} />
      </Sheet>
    </div>
  );
}
