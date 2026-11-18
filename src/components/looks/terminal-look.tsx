import Link from 'next/link';
import { fill } from '@/lib/story-text';
import { InlineText } from '@/components/editorial/inline-text';
import { projectHref, type LookHomeProps } from './types';

/** A post's date as the log prints it: 2026-11-14. */
const isoDay = (date: string) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};
import { actTitle, type AboutProps, type ExperienceProps, type ProjectsProps } from './pages-types';

/**
 * Terminal: a shell session. Each page is a few commands and what they print: whoami, ls of the
 * projects, the numbers as JSON and a tail of the blog; inside, git log for the experience, a man
 * page for About and ls -la for the projects.
 */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** A short, stable hash for a line of text, so the log reads like git's. */
const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
};

function Prompt({ cmd, path = '~' }: { cmd: string; path?: string }) {
  return (
    <p className="tm-prompt">
      <span className="tm-user">visitor@dhucar</span>:<span className="tm-path">{path}</span>$ <span className="tm-cmd">{cmd}</span>
    </p>
  );
}

function Window({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`tm-window ${className}`}>
      <p className="tm-bar" aria-hidden>
        <span className="tm-lights">
          <i />
          <i />
          <i />
        </span>
        {title}
      </p>
      <div className="tm-body">{children}</div>
    </div>
  );
}

export function TerminalHome({ heading, name, projects, metrics, since, posts, writing }: LookHomeProps) {
  return (
    <div className="home-terminal look-home">
      <p id="tm-title" role="heading" aria-level={1} className="sr-only">
        {heading}
      </p>
      <Window title="visitor@dhucar: ~ (zsh)">
        <p className="tm-dim">Last login: {since} on ttys001 · Hyderabad</p>
        <Prompt cmd="whoami" />
        <p className="tm-big">{name}</p>
        <p>Senior Software Engineer · AI Architect · builds fast .NET systems and ships them with teams of AI agents.</p>
        <Prompt cmd="ls ~/projects" />
        <ul className="tm-ls">
          {projects.slice(0, 8).map((p) => (
            <li key={p.title}>
              <Link href={projectHref(p)}>{slug(p.title)}/</Link>
            </li>
          ))}
        </ul>
        <Prompt cmd="cat metrics.json" />
        <dl className="tm-json">
          <span aria-hidden>{'{'}</span>
          {metrics.map((m, i) => (
            <div key={m.label}>
              <dt>&quot;{slug(m.label)}&quot;:</dt>
              <dd>
                &quot;{m.value}&quot;{i < metrics.length - 1 ? ',' : ''}
              </dd>
            </div>
          ))}
          <span aria-hidden>{'}'}</span>
        </dl>
        {writing ? (
          <Prompt cmd="cd ~/blog" />
        ) : (
          <>
            <Prompt cmd="tail -n 5 ~/blog/posts.log" />
            <ol className="tm-log">
              {posts.slice(0, 5).map((p) => (
                <li key={p.slug}>
                  <time dateTime={p.date}>[{isoDay(p.date)}]</time> <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                </li>
              ))}
            </ol>
            <Cursor />
          </>
        )}
      </Window>
      {writing && <TerminalWriting {...writing} />}
    </div>
  );
}

function Cursor({ path = '~' }: { path?: string }) {
  return (
    <p className="tm-prompt">
      <span className="tm-user">visitor@dhucar</span>:<span className="tm-path">{path}</span>$ <span className="tm-cursor" aria-hidden />
    </p>
  );
}

/**
 * Terminal's writing section, in place of the shared blog list: the newest posts as a long listing
 * (date, read time, category, title), the three newest with their excerpt as a comment, then the
 * topics as a directory listing with their post counts.
 */
function TerminalWriting({ posts, topics, total }: NonNullable<LookHomeProps['writing']>) {
  if (posts.length === 0) return null;
  const shown = posts.slice(0, 10);
  return (
    <section aria-labelledby="tm-blog-title" className="tm-blog">
      <Window title="visitor@dhucar: ~/blog (zsh)">
        <h2 id="tm-blog-title" className="sr-only">
          Writing
        </h2>
        <Prompt cmd={`ls -lt | head -${shown.length}`} path="~/blog" />
        <p className="tm-dim">total {total}</p>
        <ol className="tm-posts">
          {shown.map((p, i) => (
            <li key={p.slug}>
              <time dateTime={p.date} className="tm-post-date">
                {isoDay(p.date)}
              </time>
              <span className="tm-post-read">{p.readTime.replace(/\s*read$/i, '')}</span>
              <span className="tm-post-cat" title={p.category}>
                {slug(p.category)}
              </span>
              <span className="tm-post-main">
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                {i < 3 && p.excerpt && <span className="tm-desc"># {p.excerpt}</span>}
              </span>
            </li>
          ))}
        </ol>
        {topics.length > 0 && (
          <>
            <Prompt cmd="ls ~/blog/topics" path="~/blog" />
            <ul className="tm-topics">
              {topics.map((t) => (
                <li key={t.slug}>
                  <Link href={`/topics/${t.slug}`} className={t.kind === 'category' ? 'tm-topic-cat' : undefined}>
                    {t.kind === 'category' ? `${t.slug}/` : t.slug}
                  </Link>
                  <span className="tm-dim">({t.count})</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <Prompt cmd="open --all" path="~/blog" />
        <p>
          <Link href="/blog" className="tm-open">
            → all {total} posts
          </Link>{' '}
          <span className="tm-dim">·</span>{' '}
          <Link href="/topics" className="tm-open">
            → every topic
          </Link>
        </p>
        <Cursor path="~/blog" />
      </Window>
    </section>
  );
}

export function TerminalExperience({ experience, clientProjects, journey }: ExperienceProps) {
  const groups = [...experience.groups].reverse();
  return (
    <div className="look-only only-terminal tm-page">
      <Window title="~/career (git)">
        <Prompt cmd="git log --oneline --graph --all" path="~/career" />
        {groups.map((g) => (
          <div key={g.label} className="tm-branch">
            <p className="tm-branch-head">
              * <span className="tm-hash">{hash(g.label)}</span> <span className="tm-ref">(branch: {slug(g.label)})</span> {actTitle(journey, g.label)}
            </p>
            <ul>
              {g.items.map((item) => (
                <li key={item}>
                  <span className="tm-hash">{hash(item)}</span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Prompt cmd="cat clients.csv" path="~/career" />
        <TerminalClients clientProjects={clientProjects} />
      </Window>
    </div>
  );
}

function TerminalClients({ clientProjects }: { clientProjects: ProjectsProps['clientProjects'] }) {
  return (
    <table className="tm-table">
      <thead>
        <tr>
          <th scope="col">client</th>
          <th scope="col" className="tm-hide-sm">role</th>
          <th scope="col">years</th>
        </tr>
      </thead>
      <tbody>
        {clientProjects.map((c) => (
          <tr key={c.id}>
            <td>{c.client}</td>
            <td className="tm-hide-sm">{c.role}</td>
            <td>{c.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TerminalAbout({ name, values, about }: AboutProps) {
  return (
    <div className="look-only only-terminal tm-page">
      <Window title="man madhukar">
        <p className="tm-man-head" aria-hidden>
          <span>MADHUKAR(1)</span>
          <span>User Commands</span>
          <span>MADHUKAR(1)</span>
        </p>
        <h2>NAME</h2>
        <p role="heading" aria-level={1} className="tm-indent">
          madhukar · <InlineText text={fill(about?.title ?? name, values)} />
        </p>
        {about && (
          <>
            <h2>SYNOPSIS</h2>
            <p className="tm-indent">{fill(about.byline, values)}</p>
            <h2>DESCRIPTION</h2>
            {about.qa.map(({ q, a }) => (
              <div key={q} className="tm-indent">
                <p className="tm-opt">{q}</p>
                <p className="tm-indent">
                  <InlineText text={fill(a, values)} />
                </p>
              </div>
            ))}
          </>
        )}
        <h2>SEE ALSO</h2>
        <p className="tm-indent">
          <Link href="/projects">projects(1)</Link>, <Link href="/experience">experience(1)</Link>, <Link href="/fix-a-bug">fix-a-bug(8)</Link>
        </p>
      </Window>
    </div>
  );
}

export function TerminalProjects({ keyProjects, clientProjects }: ProjectsProps) {
  return (
    <div className="look-only only-terminal tm-page">
      <Window title="~/projects">
        <Prompt cmd="ls -la" path="~/projects" />
        <ul className="tm-lsla">
          {keyProjects.map((p) => (
            <li key={p.title}>
              <span className="tm-perm" aria-hidden>
                drwxr-xr-x
              </span>
              <span className="tm-stack">{p.tech[0]}</span>
              <span>
                <Link href={projectHref(p)}>{slug(p.title)}/</Link>
                <span className="tm-desc"># {p.description}</span>
                {p.outcome && <span className="tm-out">→ {p.outcome}</span>}
              </span>
            </li>
          ))}
        </ul>
        <Prompt cmd="cat clients.csv" path="~/projects" />
        <TerminalClients clientProjects={clientProjects} />
      </Window>
    </div>
  );
}

