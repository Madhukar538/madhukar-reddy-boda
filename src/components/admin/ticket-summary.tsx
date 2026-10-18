'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { TicketPriority, TicketSummary as Summary } from '@/lib/admin/types';
import { useAdmin } from '@/components/admin/session';
import { PriorityChip, StatusChip } from '@/components/admin/ticket-badges';
import { Panel, formatDateTime } from '@/components/admin/ui';

const PRIORITIES: TicketPriority[] = ['P1', 'P2', 'P3', 'P4'];

function hours(value: number | null) {
  if (value === null) return '—';
  return value < 48 ? `${value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} h` : `${(value / 24).toLocaleString('en-IN', { maximumFractionDigits: 1 })} d`;
}

/** Tickets at a glance on the dashboard: what needs attention, how many came in, how fast they get resolved. */
export function TicketSummary() {
  const { call } = useAdmin();
  const [summary, setSummary] = useState<Summary | null>(null);
  useEffect(() => {
    call<Summary>('GetTicketSummary', {}).then(setSummary).catch(() => {});
  }, [call]);
  if (!summary) return null;

  const active = summary.byStatus.open + summary.byStatus['in-progress'];
  const tiles = [
    { label: 'Need attention', value: active.toLocaleString('en-IN'), hint: `${summary.byStatus.open} open · ${summary.byStatus['in-progress']} in progress` },
    { label: 'New this week', value: summary.newLast7Days.toLocaleString('en-IN'), hint: `${summary.newLast30Days} in 30 days` },
    { label: 'Avg. time to resolve', value: hours(summary.averageResolutionHours), hint: 'last 90 days' },
    { label: 'All time', value: summary.total.toLocaleString('en-IN'), hint: `${summary.byStatus.resolved + summary.byStatus.closed} resolved or closed` },
  ];

  return (
    <Panel
      title="Tickets"
      description="Bug reports and enquiries from the site."
      actions={
        <Link href="/admin/tickets" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          All tickets <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="glass-inset rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{t.value}</p>
            <p className="text-xs text-muted-foreground">{t.hint}</p>
          </div>
        ))}
      </div>
      {active > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Active by priority</span>
          {PRIORITIES.filter((p) => summary.activeByPriority[p] > 0).map((p) => (
            <Link key={p} href="/admin/tickets" className="inline-flex items-center gap-1.5">
              <PriorityChip priority={p} />
              <span className="tabular-nums">{summary.activeByPriority[p]}</span>
            </Link>
          ))}
        </div>
      )}
      {summary.recent.length > 0 && (
        <ul className="mt-4 divide-y divide-foreground/10">
          {summary.recent.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/tickets/${t.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-1 py-2.5 hover:bg-foreground/[0.04]">
                <PriorityChip priority={t.priority} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                <StatusChip status={t.status} />
                <span className="text-xs tabular-nums text-muted-foreground">{formatDateTime(t.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
