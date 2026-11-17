import Link from 'next/link';
import { fill } from '@/lib/story-text';
import { InlineText } from '@/components/editorial/inline-text';
import { projectHref } from './types';
import { actTitle, type AboutProps, type ExperienceProps, type ProjectsProps } from './pages-types';

/** Dune's inner pages: the book's chapters, its preface and its catalogue. */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** Clients as the back-of-book index: name, dot leaders, years. */
function DuneIndex({ clientProjects, title }: { clientProjects: ProjectsProps['clientProjects']; title: string }) {
  return (
    <section className="du-chapter" aria-labelledby="du-index-title">
      <p className="du-chapter-no" aria-hidden>
        Appendix
      </p>
      <h2 id="du-index-title">{title}</h2>
      <dl className="du-figures du-index">
        {clientProjects.map((c) => (
          <div key={c.id}>
            <dt>
              {c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.client}</a> : c.client}
              <span>{c.role}</span>
            </dt>
            <span className="du-leader" aria-hidden />
            <dd>{c.duration}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Experience: one chapter per part of the work, from the start, its achievements as numbered paragraphs. */
export function DuneExperience({ experience, clientProjects, journey }: ExperienceProps) {
  const groups = [...experience.groups].reverse();
  return (
    <div className="look-only only-dune du-page">
      {groups.map((g, i) => (
        <section key={g.label} className="du-chapter" aria-labelledby={`du-exp-${i}`}>
          <p className="du-chapter-no" aria-hidden>
            Chapter {ROMAN[i]} · {g.label}
          </p>
          <h2 id={`du-exp-${i}`}>{actTitle(journey, g.label)}</h2>
          <ol className="du-paras">
            {g.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      ))}
      <DuneIndex clientProjects={clientProjects} title="Index of commissions" />
    </div>
  );
}

/** About: the preface, as a letter to the reader, signed. */
export function DuneAbout({ name, values, about }: AboutProps) {
  return (
    <div className="look-only only-dune du-page du-preface">
      <p className="du-chapter-no" aria-hidden>
        {about?.kicker ?? 'Preface'}
      </p>
      <p role="heading" aria-level={1} className="du-preface-title">
        <InlineText text={fill(about?.title ?? name, values)} />
      </p>
      {about && <p className="du-preface-by">{fill(about.byline, values)}</p>}
      {about &&
        about.qa.map(({ q, a }) => (
          <div key={q} className="du-preface-part">
            <h2>{q}</h2>
            <p>
              <InlineText text={fill(a, values)} />
            </p>
          </div>
        ))}
      <p className="du-signature">— {name.split(' ').slice(-2).join(' ')}</p>
    </div>
  );
}

/** Projects: the catalogue, one numbered plate per project with its result as a caption; clients in the index. */
export function DuneProjects({ keyProjects, clientProjects }: ProjectsProps) {
  return (
    <div className="look-only only-dune du-page">
      <ol className="du-plates">
        {keyProjects.map((p, i) => (
          <li key={p.title}>
            <Link href={projectHref(p)}>
              <span className="du-plate-no">Plate {ROMAN[i] ?? i + 1}</span>
              <span className="du-plate-title">{p.title}</span>
              <span className="du-plate-desc">{p.description}</span>
              {p.outcome && <span className="du-plate-cap">{p.outcome}</span>}
              <span className="du-tech">{p.tech.slice(0, 4).join(', ')}</span>
            </Link>
          </li>
        ))}
      </ol>
      <DuneIndex clientProjects={clientProjects} title="Index of commissions" />
    </div>
  );
}
