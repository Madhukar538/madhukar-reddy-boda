'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Trash2 } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import type { AdminComment, CommentStatus } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { ListToolbar, Pager, usePaged } from '@/components/admin/paged-list';
import { useAdmin } from '@/components/admin/session';
import { Notice, Spinner, dangerButton, formatDateTime, secondaryButton } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

type StatusFilter = CommentStatus | 'all';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'pending', label: 'Waiting' },
  { key: 'approved', label: 'Approved' },
  { key: 'spam', label: 'Spam' },
  { key: 'all', label: 'All' },
];

const STATUS_CHIP: Record<CommentStatus, string> = { pending: 'chip chip-orange', approved: 'chip chip-accent', spam: 'chip' };

/** Reader comments: nothing shows on the site until it is approved here. */
function CommentList() {
  const { call } = useAdmin();
  const [status, setStatus] = useState<StatusFilter>('pending');
  const { data, error, isLoading, setPage, search, setSearch, reload } = usePaged<AdminComment>('GetComments', { status }, 15);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const moderate = async (id: string, action: 'approve' | 'delete') => {
    if (action === 'delete' && !window.confirm('Delete this comment for good?')) return;
    setBusy(id);
    setActionError('');
    try {
      await call('ModerateComment', { id, action });
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <ListToolbar search={search} onSearch={setSearch} placeholder="Search" tabs={TABS} active={status} onTab={setStatus} />
      {(error || actionError) && <Notice>{error || actionError}</Notice>}
      {!data ? (
        !error && <Spinner />
      ) : (
        <>
          <ul className="space-y-3">
            {data.items.map((c) => (
              <li key={c.id} className={cn('glass p-5', busy === c.id && 'opacity-60')}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold">{c.name}</span>
                  <span className={STATUS_CHIP[c.status]}>{c.status}</span>
                  {c.country && <span className="text-xs text-muted-foreground">{c.country}</span>}
                  <span className="ml-auto tabular-nums text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                </div>
                <Link href={`/blog/${c.slug}#comments`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  on “{c.postTitle}” <ExternalLink className="h-3 w-3" />
                </Link>
                <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-relaxed">{c.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.status !== 'approved' && (
                    <button type="button" disabled={busy !== null} onClick={() => moderate(c.id, 'approve')} className="tinted-button !px-4 !py-1.5 !text-sm">
                      <Check className="h-4 w-4" /> Approve
                    </button>
                  )}
                  <button type="button" disabled={busy !== null} onClick={() => moderate(c.id, 'delete')} className={c.status === 'approved' ? dangerButton : secondaryButton}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {data.items.length === 0 && (
            <p className="glass px-5 py-6 text-sm text-muted-foreground">{status === 'pending' ? 'Nothing waiting for review.' : 'No comments here.'}</p>
          )}
          <Pager data={data} onPage={setPage} isLoading={isLoading} />
        </>
      )}
    </div>
  );
}

export default function CommentsPage() {
  return (
    <AdminShell title="Comments">
      <CommentList />
    </AdminShell>
  );
}
