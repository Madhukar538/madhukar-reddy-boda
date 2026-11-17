import Link from 'next/link';
import { fill } from '@/lib/story';
import { InlineText } from '@/components/editorial/inline-text';
import { projectHref, shortDate, type LookHomeProps } from './types';
import { actTitle, type AboutProps, type ExperienceProps, type ProjectsProps } from './pages-types';

/**
 * Receipt: a thermal till receipt. The homepage is one long slip (the projects as line items, the
 * numbers as the totals, a barcode and a thank-you); inside, an itemised receipt per part of the work,
 * the customer copy of an interview, and a stack of receipts for the projects.
 */

function Slip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rc-slip ${className}`}>{children}</div>;
}

const Rule = () => <p className="rc-rule" aria-hidden />;

export function ReceiptHome({ heading, name, projects, metrics, since, posts }: LookHomeProps) {
  return (
    <div className="home-receipt look-home">
      <p id="rc-title" role="heading" aria-level={1} className="sr-only">
        {heading}
      </p>
      <Slip className="rc-main">
        <p className="rc-store" aria-hidden>
          DHUCAR.IN
        </p>
        <p className="rc-center">{name.toUpperCase()}</p>
        <p className="rc-center">SENIOR SOFTWARE ENGINEER</p>
        <p className="rc-center">HYDERABAD · OPEN SINCE {since.toUpperCase()}</p>
        <Rule />
        <p className="rc-row">
          <span>QTY ITEM</span>
          <span>STACK</span>
        </p>
        <Rule />
        <ol className="rc-items">
          {projects.slice(0, 8).map((p) => (
            <li key={p.title}>
              <Link href={projectHref(p)} className="rc-row">
                <span>1 × {p.title}</span>
                <span>{p.tech[0]}</span>
              </Link>
            </li>
          ))}
        </ol>
        <Rule />
        <dl className="rc-totals">
          {metrics.map((m, i) => (
            <div key={m.label} className={i === metrics.length - 1 ? 'rc-total' : undefined}>
              <dt>{m.label.toUpperCase()}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
        <Rule />
        <p className="rc-center rc-paid" aria-hidden>
          ** SHIPPED **
        </p>
        <p className="rc-barcode" aria-hidden />
        <p className="rc-center">THANK YOU FOR VISITING</p>
        <p className="rc-center rc-small">KEEP THIS RECEIPT FOR YOUR RECORDS</p>
      </Slip>

      <Slip className="rc-side">
        <h2 className="rc-center">RECENT TRANSACTIONS</h2>
        <Rule />
        <ol className="rc-items">
          {posts.slice(0, 5).map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="rc-row rc-post">
                <span>{p.title}</span>
                <span>{shortDate(p.date).toUpperCase()}</span>
              </Link>
            </li>
          ))}
        </ol>
        <Rule />
        <Link href="/fix-a-bug" className="rc-center rc-cta">
          RETURNS &amp; BUG REPORTS →
        </Link>
      </Slip>
    </div>
  );
}

export function ReceiptExperience({ experience, clientProjects, journey }: ExperienceProps) {
  const groups = [...experience.groups].reverse();
  return (
    <div className="look-only only-receipt rc-page rc-stack">
      {groups.map((g, i) => (
        <Slip key={g.label}>
          <h2 className="rc-center">{actTitle(journey, g.label).toUpperCase()}</h2>
          <p className="rc-center rc-small">
            {g.label.toUpperCase()} · RECEIPT {String(i + 1).padStart(4, '0')}
          </p>
          <Rule />
          <ol className="rc-lines">
            {g.items.map((item, n) => (
              <li key={item}>
                <span aria-hidden>{String(n + 1).padStart(2, '0')}</span>
                {item}
              </li>
            ))}
          </ol>
          <Rule />
          <p className="rc-row rc-total">
            <span>ITEMS</span>
            <span>{g.items.length}</span>
          </p>
        </Slip>
      ))}
      <ReceiptHistory clientProjects={clientProjects} />
    </div>
  );
}

function ReceiptHistory({ clientProjects }: { clientProjects: ProjectsProps['clientProjects'] }) {
  return (
    <Slip className="rc-wide">
      <h2 className="rc-center">ORDER HISTORY</h2>
      <Rule />
      <ol className="rc-items">
        {clientProjects.map((c) => (
          <li key={c.id} className="rc-row">
            <span>
              {c.client.toUpperCase()}
              <small>{c.role}</small>
            </span>
            <span>{c.duration}</span>
          </li>
        ))}
      </ol>
    </Slip>
  );
}

export function ReceiptAbout({ name, values, about }: AboutProps) {
  return (
    <div className="look-only only-receipt rc-page">
      <Slip className="rc-wide">
        <p className="rc-center rc-small">CUSTOMER COPY · {(about?.kicker ?? 'About').toUpperCase()}</p>
        <p role="heading" aria-level={1} className="rc-store rc-heading">
          <InlineText text={fill(about?.title ?? name, values)} />
        </p>
        {about && <p className="rc-center">{fill(about.byline, values)}</p>}
        <Rule />
        {about?.qa.map(({ q, a }, i) => (
          <div key={q} className="rc-qa">
            <p className="rc-q">
              {String(i + 1).padStart(2, '0')} {q.toUpperCase()}
            </p>
            <p>
              <InlineText text={fill(a, values)} />
            </p>
          </div>
        ))}
        <Rule />
        <p className="rc-center rc-paid" aria-hidden>
          ** SIGNED **
        </p>
      </Slip>
    </div>
  );
}

export function ReceiptProjects({ keyProjects, clientProjects }: ProjectsProps) {
  return (
    <div className="look-only only-receipt rc-page">
      <ul className="rc-grid">
        {keyProjects.map((p, i) => (
          <li key={p.title}>
            <Link href={projectHref(p)}>
              <Slip>
                <p className="rc-center rc-small">ORDER #{String(1001 + i)}</p>
                <h2 className="rc-center">{p.title.toUpperCase()}</h2>
                <Rule />
                <p>{p.description}</p>
                <Rule />
                <ul className="rc-lines rc-tech">
                  {p.tech.slice(0, 4).map((t) => (
                    <li key={t} className="rc-row">
                      <span>{t}</span>
                      <span>1</span>
                    </li>
                  ))}
                </ul>
                {p.outcome && <p className="rc-paid rc-center">** {p.outcome.split(/[.,]/)[0].toUpperCase()} **</p>}
              </Slip>
            </Link>
          </li>
        ))}
      </ul>
      <ReceiptHistory clientProjects={clientProjects} />
    </div>
  );
}
