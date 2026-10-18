import Link from 'next/link';
import type { ReactNode } from 'react';
import { BarChart3, Calendar, ChevronDown, Clock, Folder, Link2, Tags } from 'lucide-react';
import type { BlogPost } from '@/data/blogs';
import { slugify } from '@/lib/blog';
import { engagementEnabled } from '@/lib/engagement';
import { ReadCount } from '@/components/blog/post-engagement';

function Row({ icon: Icon, name, children }: { icon: typeof Folder; name: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 py-1.5 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {name}
      </dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Obsidian's Properties view: the post's metadata as a key/value table.
 * Phones get one line instead (category · reading time · date), with the rest behind a tap,
 * so the article starts on the first screen.
 */
export function Properties({ post, words, links }: { post: BlogPost; words: number; links: number }) {
  const published = new Date(Date.parse(post.date));
  return (
    <>
      <details className="vault-props-compact group glass-inset px-3 py-2 text-sm sm:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
          <span className="chip chip-accent">{post.category}</span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {post.readTime.replace(/ read$/, '')} ·{' '}
            <time dateTime={published.toISOString()}>{post.date}</time>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground" aria-hidden>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </span>
          <span className="sr-only">Show tags and details</span>
        </summary>
        <dl className="mt-2 border-t border-foreground/10 pt-1">
          <Row icon={Tags} name="tags">
            <span className="flex flex-wrap gap-x-1.5 gap-y-2.5">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/topics/${slugify(tag)}`} className="vault-tag">
                  #{tag}
                </Link>
              ))}
            </span>
          </Row>
          <Row icon={Folder} name="category">
            <Link href={`/topics/${slugify(post.category)}`} className="text-primary">
              {post.category}
            </Link>
          </Row>
          <Row icon={Clock} name="length">{words.toLocaleString('en-US')} words</Row>
          {engagementEnabled && (
            <Row icon={BarChart3} name="reads">
              <ReadCount slug={post.slug} />
            </Row>
          )}
          <Row icon={Link2} name="links">
            <a href="#linked-mentions" className="text-primary">
              {links} linked {links === 1 ? 'note' : 'notes'}
            </a>
          </Row>
        </dl>
      </details>
    <section aria-label="Properties" className="vault-props glass-inset hidden px-4 py-3 text-sm sm:block">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Properties</p>
      <dl>
        <Row icon={Folder} name="category">
          <Link href={`/topics/${slugify(post.category)}`} className="chip chip-accent">
            {post.category}
          </Link>
        </Row>
        <Row icon={Tags} name="tags">
          <span className="flex flex-wrap gap-1.5" data-previews>
            {post.tags.map((tag) => (
              <Link key={tag} href={`/topics/${slugify(tag)}`} className="vault-tag">
                #{tag}
              </Link>
            ))}
          </span>
        </Row>
        <Row icon={Calendar} name="published">
          <time dateTime={new Date(Date.parse(post.date)).toISOString()}>{post.date}</time>
        </Row>
        <Row icon={Clock} name="reading time">
          {post.readTime} · {words.toLocaleString('en-US')} words
        </Row>
        {engagementEnabled && (
          <Row icon={BarChart3} name="reads">
            <ReadCount slug={post.slug} />
          </Row>
        )}
        <Row icon={Link2} name="links">
          <a href="#linked-mentions" className="text-primary hover:underline">
            {links} linked {links === 1 ? 'note' : 'notes'}
          </a>
        </Row>
      </dl>
    </section>
    </>
  );
}
