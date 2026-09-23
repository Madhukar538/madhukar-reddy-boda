import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/portfolio/page-shell';
import { allTopics, postsForTopic } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Topics — Boda Madhukar Reddy',
  description: 'Browse posts by topic: software architecture, AI and RAG, DevOps and homelab, observability and performance.',
  alternates: { canonical: '/topics' },
};

export default function TopicsPage() {
  const topics = allTopics();
  const categories = topics.filter((t) => t.kind === 'category');
  const tags = topics.filter((t) => t.kind === 'tag');

  return (
    <PageShell eyebrow="Browse" title="Topics" description="Every subject I write about, from broad areas down to specific tools.">
      <section aria-label="Areas" className="grid gap-4 sm:grid-cols-2">
        {categories.map((t) => (
          <Link key={t.slug} href={`/topics/${t.slug}`} className="group glass glass-interactive p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t.count} {t.count === 1 ? 'post' : 'posts'}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">{t.name}</h2>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {postsForTopic(t.slug)
                .slice(0, 3)
                .map((p) => (
                  <li key={p.slug} className="line-clamp-1">· {p.title}</li>
                ))}
            </ul>
          </Link>
        ))}
      </section>

      <section aria-labelledby="tags-heading" className="mt-12">
        <h2 id="tags-heading" className="mb-4 text-xl font-bold tracking-tight">Tools &amp; techniques</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link key={t.slug} href={`/topics/${t.slug}`} className="chip hover:text-foreground transition-colors !text-[0.8rem] !px-3 !py-1.5">
              {t.name}
              <span className="ml-1 text-muted-foreground">{t.count}</span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
