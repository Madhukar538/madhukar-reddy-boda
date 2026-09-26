import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Bug } from 'lucide-react';
import { AuthorCard } from '@/components/portfolio/author-card';
import { ArchitectureDiagram } from '@/components/portfolio/architecture-diagram';
import { diagrams } from '@/data/diagrams';
import { ReaderChrome } from '@/components/blog/reader-chrome';
import { ShareButtons } from '@/components/blog/share-buttons';
import { PostCard } from '@/components/blog/post-card';
import { adjacentPosts, getPost, isoDate, posts, relatedPosts, renderPost, siteUrl } from '@/lib/blog';
import { localGraph, postLinks } from '@/lib/vault';
import { Properties } from '@/components/vault/properties';
import { LinkedMentions } from '@/components/vault/linked-mentions';
import { LocalGraphLazy } from '@/components/vault/local-graph-lazy';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: `${post.title} — Boda Madhukar Reddy`,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: isoDate(post),
      authors: ['Boda Madhukar Reddy'],
      section: post.category,
      tags: post.tags,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  };
}

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { html, toc, words } = renderPost(post);
  const diagram = diagrams[post.slug];
  const related = relatedPosts(post);
  const { newer, older } = adjacentPosts(post);
  const links = postLinks(post);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: isoDate(post),
    wordCount: words,
    keywords: post.tags.join(', '),
    articleSection: post.category,
    url: `${siteUrl()}/blog/${post.slug}`,
    image: `${siteUrl()}/blog/${post.slug}/opengraph-image`,
    author: { '@type': 'Person', name: 'Boda Madhukar Reddy', url: `${siteUrl()}/about` },
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-8 lg:pt-36 pb-12 lg:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <Link
        href="/"
        className="glass glass-pill glass-interactive inline-flex items-center gap-1.5 pl-3 pr-4 py-2 mb-6 text-sm font-medium text-primary group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All posts
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] items-start">
        <article className="glass p-6 md:p-10 min-w-0">
          <header className="mb-8 space-y-5">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">{post.title}</h1>
            <Properties post={post} words={words} links={links.backlinks.length + links.mentions.length + links.outgoing.length} />
          </header>

          {diagram && <ArchitectureDiagram diagram={diagram} />}

          <div className="article-body border-t border-foreground/10 pt-8" dangerouslySetInnerHTML={{ __html: html }} />

          <footer className="mt-12 space-y-8">
            <LinkedMentions {...links} />

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-6">
              <p className="text-sm font-semibold text-foreground">Found this useful? Share it.</p>
              <ShareButtons title={post.title} />
            </div>

            <div className="glass-inset p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <p className="font-semibold text-foreground">Fighting something like this in your own system?</p>
                <p className="text-sm text-muted-foreground">Describe it and I&apos;ll take a look: bugs, slow APIs, {post.category.toLowerCase()} questions.</p>
              </div>
              <Link href={`/fix-a-bug?topic=${encodeURIComponent(post.title)}`} className="tinted-button !px-4 !py-2 shrink-0">
                <Bug className="h-4 w-4" />
                File a ticket
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">About the author</p>
              <AuthorCard />
            </div>
          </footer>
        </article>

        <aside className="lg:sticky lg:top-28 space-y-4">
          <ReaderChrome toc={toc} words={words} />
          <LocalGraphLazy graph={localGraph(post.slug)} />
        </aside>
      </div>

      {(newer || older) && (
        <nav aria-label="More posts" className="mt-6 grid gap-4 sm:grid-cols-2">
          {older ? (
            <Link href={`/blog/${older.slug}`} className="group glass glass-interactive p-5">
              <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Older
              </span>
              <span className="mt-1 block font-semibold leading-snug group-hover:text-primary transition-colors">{older.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {newer && (
            <Link href={`/blog/${newer.slug}`} className="group glass glass-interactive p-5 sm:text-right">
              <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground sm:justify-end">
                Newer <ArrowRight className="h-3.5 w-3.5" />
              </span>
              <span className="mt-1 block font-semibold leading-snug group-hover:text-primary transition-colors">{newer.title}</span>
            </Link>
          )}
        </nav>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-14">
          <p className="eyebrow">Keep reading</p>
          <h2 id="related-heading" className="mb-5 text-2xl md:text-3xl font-bold tracking-tight">Related posts</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
