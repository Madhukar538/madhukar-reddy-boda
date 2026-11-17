import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ClientProject, ProjectCard } from '@/data/profile';
import { caseStudyFor } from '@/data/case-studies';

/**
 * The Projects page in the Editorial look: each built system as a case file (the brief, the
 * result, what it was built with, where to read more), then the client work as a dated log.
 * Everything comes from the project data; shown only in Editorial (globals.css .ed-only).
 */

function readMore(project: ProjectCard) {
  const study = caseStudyFor(project.title);
  if (study) return { href: `/projects/${study.slug}`, label: 'Read the case study' };
  if (project.post) return { href: `/blog/${project.post}`, label: 'Read the write-up' };
  return null;
}

/** The first year in a duration such as "2023 – 2024", for sorting the log newest first. */
const startYear = (duration: string) => Number(duration.match(/\d{4}/)?.[0] ?? 0);

export function EditorialCaseFiles({ keyProjects, clientProjects }: { keyProjects: ProjectCard[]; clientProjects: ClientProject[] }) {
  const log = [...clientProjects].sort((a, b) => startYear(b.duration) - startYear(a.duration));

  return (
    <div className="ed-only ed-files">
      <p className="ed-files-intro">
        ( {String(keyProjects.length).padStart(2, '0')} case files · {String(log.length).padStart(2, '0')} client builds )
      </p>

      <ol className="ed-file-list">
        {keyProjects.map((project, i) => {
          const more = readMore(project);
          return (
            <li key={project.title} className="ed-file ed-reveal">
              <div className="ed-file-tab">
                <span>Case file {String(i + 1).padStart(2, '0')}</span>
                {project.featured && <span className="ed-file-flag">Featured</span>}
              </div>
              <div className="ed-file-body">
                <h2>{project.title}</h2>
                <div className="ed-file-cols">
                  <div>
                    <p className="ed-file-label">The brief</p>
                    <p>{project.description}</p>
                  </div>
                  <div>
                    {project.outcome && (
                      <>
                        <p className="ed-file-label">The result</p>
                        <p className="ed-file-result">{project.outcome}</p>
                      </>
                    )}
                    <p className="ed-file-label">Built with</p>
                    <ul className="ed-file-tech">
                      {project.tech.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                    {more && (
                      <Link href={more.href} className="ed-link ed-file-more">
                        {more.label} <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="ed-log" aria-labelledby="ed-log-title">
        <h2 id="ed-log-title">The client log</h2>
        <ol>
          {log.map((c) => (
            <li key={c.id} className="ed-reveal">
              <span className="ed-log-when">{c.duration}</span>
              <span className="ed-log-what">
                <strong>{c.title}</strong>
                <span>{c.role}</span>
              </span>
              <span className="ed-log-desc">{c.description}</span>
              {c.url && (
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="ed-log-go" aria-label={`Visit ${c.title}`}>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
