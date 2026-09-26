import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '@/components/portfolio/page-shell';
import { PostCard } from '@/components/blog/post-card';
import { allTopics, postsForTopic } from '@/lib/blog';
import { getContent } from '@/lib/content';

type Props = { params: Promise<{ slug: string }> };

const findTopic = async (slug: string) => {
  const { posts } = await getContent();
  const topic = allTopics(posts).find((t) => t.slug === slug);
  return topic && { ...topic, posts: postsForTopic(posts, topic.slug) };
};

export async function generateStaticParams() {
  return allTopics((await getContent()).posts).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await findTopic((await params).slug);
  if (!topic) return { title: 'Topic not found' };
  return {
    title: `${topic.name} — Boda Madhukar Reddy`,
    description: `Posts about ${topic.name}: ${topic.posts
      .map((p) => p.title)
      .join('; ')}`.slice(0, 300),
    alternates: { canonical: `/topics/${topic.slug}` },
  };
}

export default async function TopicPage({ params }: Props) {
  const topic = await findTopic((await params).slug);
  if (!topic) notFound();
  const list = topic.posts;

  return (
    <PageShell
      eyebrow={topic.kind === 'category' ? 'Area' : 'Topic'}
      title={topic.name}
      description={`${list.length} ${list.length === 1 ? 'post' : 'posts'}`}
      actions={
        <Link href="/topics" className="glass glass-pill glass-interactive inline-flex items-center gap-1.5 pl-3 pr-4 py-2 text-sm font-medium text-primary">
          <ArrowLeft className="h-4 w-4" />
          All topics
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
    </PageShell>
  );
}
