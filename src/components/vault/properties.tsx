import Link from 'next/link';
import type { ReactNode } from 'react';
import { Calendar, Clock, Folder, Link2, Tags } from 'lucide-react';
import type { BlogPost } from '@/data/blogs';
import { slugify } from '@/lib/blog';

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

/** Obsidian's Properties view: the post's metadata as a key/value table. */
export function Properties({ post, words, links }: { post: BlogPost; words: number; links: number }) {
  return (
    <section aria-label="Properties" className="vault-props glass-inset px-4 py-3 text-sm">
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
        <Row icon={Link2} name="links">
          <a href="#linked-mentions" className="text-primary hover:underline">
            {links} linked {links === 1 ? 'note' : 'notes'}
          </a>
        </Row>
      </dl>
    </section>
  );
}
