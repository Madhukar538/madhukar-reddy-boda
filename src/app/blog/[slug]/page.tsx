import { blogs } from '@/data/blogs';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { AuthorCard } from '@/components/portfolio/author-card';
import type { Metadata } from 'next';
import { ArticleClient } from '@/components/portfolio/article-client';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = blogs.find((p) => p.slug === params.slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.title} — Boda Madhukar Reddy`,
    description: post.excerpt,
  };
}

export async function generateStaticParams() {
  return blogs.map((post) => ({ slug: post.slug }));
}

export default function BlogPostReader({ params }: Props) {
  const post = blogs.find((p) => p.slug === params.slug);
  if (!post) notFound();

  return (
    <div className="pb-12 lg:pb-16">
      <main className="container mx-auto px-4 md:px-6 pt-8 lg:pt-36 max-w-3xl">
        <Link
          href="/blog"
          className="glass glass-pill glass-interactive inline-flex items-center gap-1.5 pl-3 pr-4 py-2 mb-6 text-sm font-medium text-primary group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Blog
        </Link>

        <article className="glass p-6 md:p-10">
          <div className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip chip-accent">{post.category}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {post.date}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className="chip">{tag}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-foreground/10 pt-8">
            <ArticleClient content={post.content} />
          </div>

          <div className="mt-12 pt-8 border-t border-foreground/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              About the author
            </p>
            <AuthorCard />
          </div>
        </article>
      </main>
    </div>
  );
}
