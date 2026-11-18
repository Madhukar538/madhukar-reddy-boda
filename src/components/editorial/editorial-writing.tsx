import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { postMetrics } from '@/data/post-metrics';

/** What the writing desk needs of a post and a topic: kept small, as it travels with the page. */
export type DeskPost = { slug: string; title: string; excerpt: string; date: string; readTime: string; category: string };
export type DeskTopic = { slug: string; name: string; count: number; kind: 'category' | 'tag' };

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const no = (n: number) => String(n).padStart(2, '0');

/**
 * The Editorial homepage's writing, laid out like a magazine's front of book: the newest post as
 * the lead story with its headline number, the next four as a numbered column beside it, an index
 * of the rest as rows, and the topics as a run-in line rather than chips.
 */
export function EditorialWriting({ posts, topics, total }: { posts: DeskPost[]; topics: DeskTopic[]; total: number }) {
  const [lead, ...rest] = posts;
  if (!lead) return null;
  const column = rest.slice(0, 4);
  const index = rest.slice(4, 10);
  const leadMetric = postMetrics[lead.slug];

  return (
    <section className="ed-desk" aria-labelledby="ed-desk-title">
      <header className="ed-desk-head">
        <p className="ed-story-kicker">( From the desk )</p>
        <h2 id="ed-desk-title">The writing</h2>
        <Link href="/blog" className="ed-link">
          All {total} posts <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="ed-desk-front">
        <article className="ed-desk-lead">
          <p className="ed-desk-meta">
            <span className="ed-desk-flag">Latest</span>
            {lead.category} · {day(lead.date)} · {lead.readTime}
          </p>
          <h3>
            <Link href={`/blog/${lead.slug}`}>{lead.title}</Link>
          </h3>
          <p className="ed-desk-excerpt">{lead.excerpt}</p>
          <div className="ed-desk-foot">
            {leadMetric && (
              <p className="ed-desk-metric">
                <strong>{leadMetric.value}</strong> {leadMetric.label}
              </p>
            )}
            <Link href={`/blog/${lead.slug}`} className="ed-desk-read" aria-label={`Read: ${lead.title}`}>
              Read <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </article>

        <ol className="ed-desk-column">
          {column.map((post, i) => {
            const metric = postMetrics[post.slug];
            return (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`}>
                  <span className="ed-desk-no" aria-hidden>{no(i + 2)}</span>
                  <span className="ed-desk-item">
                    <span className="ed-desk-meta">{post.category} · {day(post.date)}</span>
                    <span className="ed-desk-title">{post.title}</span>
                    {metric && (
                      <span className="ed-desk-metric">
                        <strong>{metric.value}</strong> {metric.label}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      {index.length > 0 && (
        <div className="ed-desk-index">
          <p className="ed-desk-label">Also in the archive</p>
          <ol>
            {index.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`}>
                  <time dateTime={post.date}>{day(post.date)}</time>
                  <span>{post.title}</span>
                  <em>{post.category}</em>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {topics.length > 0 && (
        <nav className="ed-desk-topics" aria-label="Topics">
          <p className="ed-desk-label">Filed under</p>
          <p className="ed-desk-runin">
            {topics.map((t) => (
              <Link key={t.slug} href={`/topics/${t.slug}`} data-kind={t.kind}>
                {t.name}
                <sup>{t.count}</sup>
              </Link>
            ))}
            <Link href="/topics" className="ed-desk-all">
              All topics →
            </Link>
          </p>
        </nav>
      )}
    </section>
  );
}
