'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import type { AdminPage } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { Notice, Spinner, formatDateTime } from '@/components/admin/ui';

/** Standalone pages, each at its own address (/uses, /now...), drafts included. */
function PageList() {
  const { call } = useAdmin();
  const [pages, setPages] = useState<AdminPage[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    call<AdminPage[]>('GetAllPages')
      .then(setPages)
      .catch((e) => setError(errorMessage(e)));
  }, [call]);

  if (error) return <Notice>{error}</Notice>;
  if (!pages) return <Spinner />;

  return (
    <div className="glass divide-y divide-foreground/10 overflow-hidden">
      {pages.map((page) => (
        <Link key={page.slug} href={`/admin/pages/${page.slug}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-foreground/[0.04]">
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{page.title}</span>
            <span className="block font-mono text-xs text-muted-foreground">/{page.slug}</span>
          </span>
          {!page.isPublished && <span className="chip chip-orange">Draft</span>}
          <span className="w-44 text-right text-sm tabular-nums text-muted-foreground">{formatDateTime(page.updatedAt)}</span>
        </Link>
      ))}
      {pages.length === 0 && (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          No pages yet. A page lives at its own address, like /uses or /now, and is listed in the sitemap once published.
        </p>
      )}
    </div>
  );
}

export default function PagesPage() {
  return (
    <AdminShell
      title="Pages"
      actions={
        <Link href="/admin/pages/new" className="tinted-button">
          <Plus className="h-4 w-4" /> New page
        </Link>
      }
    >
      <PageList />
    </AdminShell>
  );
}
