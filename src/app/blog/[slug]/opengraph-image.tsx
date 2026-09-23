import { getPost, posts } from '@/lib/blog';
import { OG_SIZE, ogCard } from '@/lib/og-card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Blog post by Boda Madhukar Reddy';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return ogCard({
    eyebrow: post?.category ?? 'Blog',
    title: post?.title ?? 'Engineering notes',
    meta: post ? `${post.date} · ${post.readTime}` : '',
  });
}
