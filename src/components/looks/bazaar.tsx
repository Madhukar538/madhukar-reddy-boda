import Link from 'next/link';
import { fill } from '@/lib/story-text';
import { InlineText } from '@/components/editorial/inline-text';
import { projectHref, shortDate, type LookHomeProps } from './types';
import { actTitle, type AboutProps, type ExperienceProps, type ProjectsProps } from './pages-types';

/**
 * Bazaar: a general store in Hyderabad. A painted signboard under a striped awning, the projects as
 * packed goods on wooden shelves with paper price tags, the numbers as offer stickers and the posts
 * chalked up as today's specials; inside, aisle signs, a corkboard of questions at the counter, and
 * each project as a pack with a Project Facts panel.
 */

/** Pack shapes on the shelf, so the row doesn't read as a grid of identical cards. */
const PACKS = ['bz-box', 'bz-jar', 'bz-tin', 'bz-bag', 'bz-box bz-tall', 'bz-tin bz-wide'];
const TONES = ['bz-c1', 'bz-c2', 'bz-c3', 'bz-c4', 'bz-c5'];

function Sign({ name, since }: { name: string; since: string }) {
  return (
    <header className="bz-front">
      <div className="bz-awning" aria-hidden />
      <div className="bz-sign">
        <p className="bz-sign-top" aria-hidden>
          <span>Est. {since}</span>
          <span>Hyderabad</span>
        </p>
        <p className="bz-sign-name" aria-hidden>
          The Dhucar General Store
        </p>
        <p className="bz-sign-sub">Prop. {name} · .NET systems, AI agents &amp; bug fixes</p>
      </div>
    </header>
  );
}

export function BazaarHome({ heading, name, projects, metrics, since, posts, writing }: LookHomeProps) {
  const stock = projects.slice(0, 8);
  const rows = [stock.slice(0, 4), stock.slice(4, 8)].filter((r) => r.length);
  return (
    <div className="home-bazaar look-home">
      <p id="bz-title" role="heading" aria-level={1} className="sr-only">
        {heading}
      </p>
      <Sign name={name} since={since} />

      <section aria-label="Offers" className="bz-offers">
        {metrics.map((m, i) => (
          <div key={m.label} className={`bz-sticker ${TONES[i % TONES.length]}`}>
            <span className="bz-sticker-value">{m.value}</span>
            <span className="bz-sticker-label">{m.label}</span>
          </div>
        ))}
      </section>

      <section aria-labelledby="bz-shelf-title" className="bz-shelves">
        <h2 id="bz-shelf-title" className="bz-hand">On the shelves</h2>
        {rows.map((row, r) => (
          <ul key={r} className="bz-shelf">
            {row.map((p, i) => (
              <li key={p.title} className={`${PACKS[(r * 4 + i) % PACKS.length]} ${TONES[(r * 4 + i) % TONES.length]}`}>
                <Link href={projectHref(p)} className="bz-pack">
                  <span className="bz-pack-brand">{p.tech[0]}</span>
                  <span className="bz-pack-name">{p.title}</span>
                </Link>
                <span className="bz-tag" aria-hidden>
                  {p.outcome ? 'Bestseller' : 'In stock'}
                </span>
              </li>
            ))}
          </ul>
        ))}
        <p className="bz-shelf-foot">
          <Link href="/projects">Walk the aisles →</Link>
          <Link href="/fix-a-bug" className="bz-order">
            Place an order
          </Link>
        </p>
      </section>

      <section aria-labelledby="bz-specials-title" className="bz-board">
        <h2 id="bz-specials-title">Today&apos;s specials</h2>
        <ol>
          {(writing?.posts ?? posts).slice(0, writing ? 10 : 5).map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              <span>{shortDate(p.date)}</span>
            </li>
          ))}
        </ol>
        {writing && (
          <p className="bz-board-all">
            <Link href="/blog">Full menu: all {writing.total} →</Link>
          </p>
        )}
      </section>
      {writing && writing.topics.length > 0 && (
        <section aria-labelledby="bz-tags-title" className="bz-tags">
          <h2 id="bz-tags-title">Browse by aisle</h2>
          <ul>
            {writing.topics.map((t, i) => (
              <li key={t.slug} style={{ ['--tilt' as string]: `${(((i * 7) % 5) - 2) * 0.6}deg` }}>
                <Link href={`/topics/${t.slug}`} className={t.kind === 'category' ? 'bz-tag bz-tag-cat' : 'bz-tag'}>
                  {t.name}
                  <span>{t.count} in stock</span>
                </Link>
              </li>
            ))}
          </ul>
          <p>
            <Link href="/topics" className="bz-tags-all">
              Every aisle →
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}

export function BazaarExperience({ experience, clientProjects, journey }: ExperienceProps) {
  const groups = [...experience.groups].reverse();
  return (
    <div className="look-only only-bazaar bz-page">
      {groups.map((g, i) => (
        <section key={g.label} className="bz-aisle" aria-labelledby={`bz-aisle-${i}`}>
          <p className="bz-aisle-sign" aria-hidden>
            <span>Aisle {i + 1}</span>
            {g.label}
          </p>
          <h2 id={`bz-aisle-${i}`}>{actTitle(journey, g.label)}</h2>
          <ul>
            {g.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
      <BazaarRegister clientProjects={clientProjects} />
    </div>
  );
}

function BazaarRegister({ clientProjects }: { clientProjects: ProjectsProps['clientProjects'] }) {
  return (
    <section className="bz-register" aria-labelledby="bz-reg-title">
      <h2 id="bz-reg-title" className="bz-hand">Stock register: customers</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">No.</th>
            <th scope="col">Customer</th>
            <th scope="col" className="bz-hide-sm">Order</th>
            <th scope="col">Period</th>
          </tr>
        </thead>
        <tbody>
          {clientProjects.map((c, i) => (
            <tr key={c.id}>
              <td>{i + 1}</td>
              <td>{c.client}</td>
              <td className="bz-hide-sm">{c.role}</td>
              <td>{c.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function BazaarAbout({ name, values, about }: AboutProps) {
  return (
    <div className="look-only only-bazaar bz-page">
      <header className="bz-counter">
        <p className="bz-hand">{about?.kicker ?? 'Ask at the counter'}</p>
        <p role="heading" aria-level={1} className="bz-counter-title">
          <InlineText text={fill(about?.title ?? name, values)} />
        </p>
        {about && <p className="bz-counter-by">{fill(about.byline, values)}</p>}
      </header>
      {about && (
        <ul className="bz-cork">
          {about.qa.map(({ q, a }) => (
            <li key={q}>
              <p className="bz-card-q">{q}</p>
              <p>
                <InlineText text={fill(a, values)} />
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BazaarProjects({ keyProjects, clientProjects }: ProjectsProps) {
  return (
    <div className="look-only only-bazaar bz-page">
      <ul className="bz-packs">
        {keyProjects.map((p, i) => (
          <li key={p.title}>
            <Link href={projectHref(p)} className={`bz-product ${TONES[i % TONES.length]}`}>
              <span className="bz-product-front">
                <span className="bz-pack-brand">{p.tech[0]}</span>
                <span className="bz-product-name">{p.title}</span>
                <span className="bz-product-desc">{p.description}</span>
              </span>
              {/* The back of the pack: what's in it, set like a nutrition label. */}
              <span className="bz-facts">
                <span className="bz-facts-title">Project Facts</span>
                <span className="bz-facts-row">
                  <span>Serving</span>
                  <span>1 system</span>
                </span>
                <span className="bz-facts-thick" />
                <span className="bz-facts-row bz-facts-strong">
                  <span>Stack</span>
                  <span>{p.tech.length} parts</span>
                </span>
                {p.outcome && <span className="bz-facts-note">Result: {p.outcome}</span>}
                <span className="bz-facts-ing">
                  <strong>Ingredients:</strong> {p.tech.join(', ')}.
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <BazaarRegister clientProjects={clientProjects} />
    </div>
  );
}
