'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquareText } from 'lucide-react';
import type { TicketListItem, TicketPriority, TicketStatus } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { ListToolbar, Pager, usePaged } from '@/components/admin/paged-list';
import { PriorityChip, StatusChip } from '@/components/admin/ticket-badges';
import { Notice, Spinner, formatDateTime } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

type StatusFilter = 'active' | TicketStatus | 'all';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
  { key: 'all', label: 'All' },
];

const PRIORITIES: ('' | TicketPriority)[] = ['', 'P1', 'P2', 'P3', 'P4'];

/** Every enquiry from the site's bug form and genie, newest first. */
function TicketList() {
  const [status, setStatus] = useState<StatusFilter>('active');
  const [priority, setPriority] = useState<'' | TicketPriority>('');
  const { data, error, isLoading, setPage, search, setSearch } = usePaged<TicketListItem>('GetTickets', { status, priority });

  return (
    <div className="space-y-4">
      <ListToolbar search={search} onSearch={setSearch} placeholder="Search id, title, name, contact or text" tabs={TABS} active={status} onTab={setStatus} />
      <div role="group" aria-label="Priority" className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="mr-1 text-muted-foreground">Priority</span>
        {PRIORITIES.map((p) => (
          <button
            key={p || 'any'}
            type="button"
            aria-pressed={priority === p}
            onClick={() => setPriority(p)}
            className={cn('rounded-full px-3 py-1 font-medium ring-1 transition-colors', priority === p ? 'bg-primary text-primary-foreground ring-primary' : 'ring-foreground/15 hover:bg-foreground/10')}
          >
            {p || 'Any'}
          </button>
        ))}
      </div>
      {error && <Notice>{error}</Notice>}
      {!data ? (
        !error && <Spinner />
      ) : (
        <>
          <div className="glass divide-y divide-foreground/10 overflow-hidden">
            {data.items.map((t) => (
              <Link key={t.id} href={`/admin/tickets/${t.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3.5 transition-colors hover:bg-foreground/[0.04]">
                <PriorityChip priority={t.priority} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{t.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    <span className="font-mono">{t.id}</span> · {t.name} · {t.category}
                  </span>
                </span>
                {t.noteCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Notes">
                    <MessageSquareText className="h-3.5 w-3.5" /> {t.noteCount}
                  </span>
                )}
                <StatusChip status={t.status} />
                <span className="w-40 text-right text-xs tabular-nums text-muted-foreground">{formatDateTime(t.createdAt)}</span>
              </Link>
            ))}
            {data.items.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">{status === 'active' ? 'Nothing open. Nice.' : 'No tickets match.'}</p>}
          </div>
          <Pager data={data} onPage={setPage} isLoading={isLoading} />
        </>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <AdminShell title="Tickets">
      <TicketList />
    </AdminShell>
  );
}
