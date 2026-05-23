import { blogs } from '@/data/blogs';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Terminal } from 'lucide-react';
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
    <div className="min-h-dvh pb-24">
      <main className="container mx-auto px-4 md:px-6 pt-24 max-w-3xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 font-mono text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5 text-primary" />
          <Link href="/" className="hover:text-primary transition-colors">~</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary transition-colors">blog</Link>
          <span>/</span>
          <span className="text-foreground/60 truncate max-w-xs">{post.slug}</span>
        </div>

        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          cd ../blog
        </Link>

        {/* Article */}
        <article className="terminal-card overflow-hidden">
          {/* Terminal chrome */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-card/80">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {post.slug}.md
            </span>
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readTime}
              </span>
            </div>
          </div>

          <div className="p-6 md:p-10">
            {/* Meta */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="font-mono text-[10px] text-yellow-400/80 border border-yellow-400/20 bg-yellow-400/5 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  {post.category}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span key={tag} className="code-tag">[{tag}]</span>
                ))}
              </div>
            </div>

            {/* Article body (client component handles progress + copy) */}
            <div className="border-t border-border pt-8">
              <ArticleClient content={post.content} />
            </div>

            {/* Author block — whoami style */}
            <div className="mt-12 pt-8 border-t border-border">
              <p className="font-mono text-xs text-muted-foreground/60 mb-4">
                {'$ whoami'}
              </p>
              <div className="terminal-card p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center font-mono font-bold text-primary text-sm shrink-0">
                    MR
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-mono text-sm font-bold text-foreground">
                      Boda Madhukar Reddy
                    </p>
                    <p className="font-mono text-xs text-primary">
                      // Software Architect @ Revalsys Technologies
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Building high-throughput .NET Core systems, load-testing with k6 + Grafana,
                      and engineering AI-driven automation tools. Writing about real-world
                      engineering problems and production-first solutions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Back to blog */}
        <div className="mt-8 flex justify-start">
          <Link
            href="/blog"
            className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            $ cd ../blog
          </Link>
        </div>
      </main>
    </div>
  );
}
