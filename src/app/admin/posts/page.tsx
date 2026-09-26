'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import type { Post } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { Notice, Spinner, fieldClass } from '@/components/admin/ui';

function PostList() {
  const { call } = useAdmin();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    call<Post[]>('GetAllPosts').then(setPosts).catch((e) => setError(errorMessage(e)));
  }, [call]);

  if (error) return <Notice>{error}</Notice>;
  if (!posts) return <Spinner />;

  const q = query.trim().toLowerCase();
  const shown = q ? posts.filter((p) => `${p.title} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(q)) : posts;

  return (
    <div className="space-y-4">
      <label className="relative block max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <span className="sr-only">Filter posts</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by title, category or tag" className={`${fieldClass} pl-9`} />
      </label>
      <div className="glass divide-y divide-foreground/10 overflow-hidden">
        {shown.map((post) => (
          <Link key={post.id} href={`/admin/posts/${post.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-foreground/[0.04]">
            <span className="min-w-0 flex-1 font-medium">{post.title}</span>
            <span className="chip">{post.category}</span>
            {!post.isPublished && <span className="chip chip-orange">Draft</span>}
            <span className="w-36 text-right text-sm tabular-nums text-muted-foreground">{post.date}</span>
          </Link>
        ))}
        {shown.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">No posts match.</p>}
      </div>
    </div>
  );
}

export default function PostsPage() {
  return (
    <AdminShell
      title="Posts"
      actions={
        <Link href="/admin/posts/new" className="tinted-button">
          <Plus className="h-4 w-4" /> New post
        </Link>
      }
    >
      <PostList />
    </AdminShell>
  );
}
