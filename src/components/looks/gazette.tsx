import Link from 'next/link';
import { fill } from '@/lib/story-text';
import { InlineText } from '@/components/editorial/inline-text';
import { projectHref, shortDate, type LookHomeProps } from './types';
import { actTitle, type AboutProps, type ExperienceProps, type ProjectsProps } from './pages-types';

/**
 * Gazette: a broadsheet newspaper. A masthead and dateline, the lead story and briefs in columns, the
 * figures in a boxed table, an opinion column of posts and a classified ad; inside, the archive, an
 * interview and the business pages.
 */

const issueDate = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

export function GazetteHome({ heading, name, projects, metrics, since, posts }: LookHomeProps) {
  const [lead, ...briefs] = projects;
  return (
    <div className="home-gazette look-home">
      <header className="gz-masthead">
        <p id="gz-title" role="heading" aria-level={1} className="sr-only">
          {heading}
        </p>
        <p className="gz-ears" aria-hidden>
          <span>Est. {since}</span>
          <span>Hyderabad edition</span>
        </p>
        <p className="gz-name" aria-hidden>
          The Dhucar Gazette
        </p>
        <p className="gz-dateline" aria-hidden>
          <span>Vol. {new Date().getFullYear() - 2021}</span>
          <span>{issueDate()}</span>
          <span>Free</span>
        </p>
      </header>

      <div className="gz-front">
        {lead && (
          <article className="gz-lead">
            <p className="gz-kicker">Lead story</p>
            <h2>
              <Link href={projectHref(lead)}>{lead.title}</Link>
            </h2>
            <p className="gz-byline">By {name} · Systems desk</p>
            <p className="gz-body">{lead.description}</p>
            {lead.outcome && <blockquote className="gz-pull">“{lead.outcome}”</blockquote>}
          </article>
        )}
        <aside className="gz-side">
          <section className="gz-box" aria-labelledby="gz-fig">
            <h2 id="gz-fig">Figures of the day</h2>
            <dl>
              {metrics.map((m) => (
                <div key={m.label}>
                  <dt>{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="gz-classified" aria-label="Classified">
            <p className="gz-kicker">Classified</p>
            <p>
              <strong>WANTED:</strong> stubborn bugs, slow APIs and flaky builds. Diagnosed fast, fixed right.
            </p>
            <Link href="/fix-a-bug">Reply to this ad →</Link>
          </section>
        </aside>
      </div>

      <section className="gz-briefs" aria-labelledby="gz-briefs-title">
        <h2 id="gz-briefs-title" className="gz-section">In brief</h2>
        <div className="gz-cols">
          {briefs.slice(0, 6).map((p) => (
            <article key={p.title}>
              <h3>
                <Link href={projectHref(p)}>{p.title}</Link>
              </h3>
              <p>{p.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gz-opinion" aria-labelledby="gz-op-title">
        <h2 id="gz-op-title" className="gz-section">Opinion &amp; analysis</h2>
        <ol>
          {posts.slice(0, 4).map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              <p>{p.excerpt}</p>
              <time dateTime={p.date}>{shortDate(p.date)}</time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function GazetteExperience({ experience, clientProjects, journey }: ExperienceProps) {
  const groups = [...experience.groups].reverse();
  return (
    <div className="look-only only-gazette gz-page">
      {groups.map((g, i) => (
        <article key={g.label} className="gz-archive">
          <p className="gz-kicker">From the archive · {g.label}</p>
          <h2>{actTitle(journey, g.label)}</h2>
          <p className="gz-byline">Part {i + 1} of {groups.length}</p>
          <div className="gz-body gz-body-cols">
            {g.items.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </article>
      ))}
      <GazetteListings clientProjects={clientProjects} />
    </div>
  );
}

function GazetteListings({ clientProjects }: { clientProjects: ProjectsProps['clientProjects'] }) {
  return (
    <section className="gz-box gz-listings" aria-labelledby="gz-list-title">
      <h2 id="gz-list-title">Client listings</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Client</th>
            <th scope="col" className="gz-hide-sm">Role</th>
            <th scope="col">Years</th>
          </tr>
        </thead>
        <tbody>
          {clientProjects.map((c) => (
            <tr key={c.id}>
              <td>{c.client}</td>
              <td className="gz-hide-sm">{c.role}</td>
              <td>{c.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function GazetteAbout({ name, values, about }: AboutProps) {
  return (
    <div className="look-only only-gazette gz-page gz-interview">
      <p className="gz-kicker">{about?.kicker ?? 'The interview'}</p>
      <p role="heading" aria-level={1} className="gz-headline">
        <InlineText text={fill(about?.title ?? name, values)} />
      </p>
      {about && <p className="gz-standfirst">{fill(about.byline, values)}</p>}
      {about && (
        <div className="gz-body gz-body-cols">
          {about.qa.map(({ q, a }) => (
            <div key={q} className="gz-qa">
              <p className="gz-q">{q}</p>
              <p>
                <InlineText text={fill(a, values)} />
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GazetteProjects({ keyProjects, clientProjects }: ProjectsProps) {
  return (
    <div className="look-only only-gazette gz-page">
      <h2 className="gz-section">Business</h2>
      <div className="gz-cols gz-business">
        {keyProjects.map((p) => (
          <article key={p.title}>
            <p className="gz-kicker">{p.tech[0]}</p>
            <h3>
              <Link href={projectHref(p)}>{p.title}</Link>
            </h3>
            <p>{p.description}</p>
            {p.outcome && <blockquote className="gz-pull">“{p.outcome}”</blockquote>}
          </article>
        ))}
      </div>
      <GazetteListings clientProjects={clientProjects} />
    </div>
  );
}
