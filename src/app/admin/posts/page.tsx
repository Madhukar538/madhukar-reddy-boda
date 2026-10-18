'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { PostListItem } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { ListToolbar, Pager, usePaged } from '@/components/admin/paged-list';
import { Notice, Spinner } from '@/components/admin/ui';

type StatusFilter = 'all' | 'published' | 'draft';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
];

function PostList() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const { data, error, isLoading, setPage, search, setSearch } = usePaged<PostListItem>('GetAllPosts', { status });

  return (
    <div className="space-y-4">
      <ListToolbar search={search} onSearch={setSearch} placeholder="Search title, category or tag" tabs={TABS} active={status} onTab={setStatus} />
      {error && <Notice>{error}</Notice>}
      {!data ? (
        !error && <Spinner />
      ) : (
        <>
          <div className="glass divide-y divide-foreground/10 overflow-hidden">
            {data.items.map((post) => (
              <Link key={post.id} href={`/admin/posts/${post.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-foreground/[0.04]">
                <span className="min-w-0 flex-1 font-medium">{post.title}</span>
                <span className="chip">{post.category}</span>
                {!post.isPublished && <span className="chip chip-orange">Draft</span>}
                <span className="w-36 text-right text-sm tabular-nums text-muted-foreground">{post.date}</span>
              </Link>
            ))}
            {data.items.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">No posts match.</p>}
          </div>
          <Pager data={data} onPage={setPage} isLoading={isLoading} />
        </>
      )}
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
