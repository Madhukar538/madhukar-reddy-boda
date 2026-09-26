'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { errorMessage } from '@/lib/admin/api';
import type { TrafficSummary } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { Notice, Panel, Spinner } from '@/components/admin/ui';
import { RankedList, TrafficChart } from '@/components/admin/traffic-chart';

const RANGES = [7, 30, 90] as const;

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { call, recoveryCodesLeft } = useAdmin();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [summary, setSummary] = useState<TrafficSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    call<TrafficSummary>('GetTrafficSummary', { days })
      .then((s) => !cancelled && setSummary(s))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [call, days]);

  const n = (v: number) => v.toLocaleString('en-IN');
  // One decimal while it's small, so a quiet month doesn't read as zero.
  const perDay = (v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: v < 10 ? 1 : 0 });

  return (
    <div className="space-y-5">
      {recoveryCodesLeft > 0 && recoveryCodesLeft < 4 && (
        <Notice>
          Only {recoveryCodesLeft} recovery {recoveryCodesLeft === 1 ? 'code is' : 'codes are'} left.{' '}
          <Link href="/admin/security" className="font-medium text-primary hover:underline">Create new ones</Link>.
        </Notice>
      )}

      {/* Filters: one row, above everything they scope. */}
      <div role="radiogroup" aria-label="Date range" className="glass glass-pill inline-flex gap-1 p-1">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={days === r}
            onClick={() => setDays(r)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              days === r ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:bg-foreground/10'
            )}
          >
            Last {r} days
          </button>
        ))}
      </div>

      {error && <Notice>{error}</Notice>}
      {!summary && loading && <Spinner />}

      {summary && (
        // While a new range loads, the previous render stays, dimmed.
        <div className={cn('space-y-5 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="Page views" value={n(summary.pageViews)} />
            <Stat label="Visitors" value={n(summary.visitors)} hint="Unique per day, added up. By design, visitors can't be linked across days." />
            <Stat label="Views per day" value={perDay(summary.pageViews / summary.days)} hint="Average over the range" />
          </div>

          <Panel title="Daily page views" description="Bots, admin pages and visitors with Do Not Track or Global Privacy Control are never counted.">
            <TrafficChart summary={summary} />
          </Panel>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Panel title="Top pages"><RankedList items={summary.topPages} /></Panel>
            <Panel title="Top referrers" description="Only the referring site is kept, never the full URL."><RankedList items={summary.topReferrers} empty="No referrers yet." /></Panel>
            <Panel title="Devices"><RankedList items={summary.devices} /></Panel>
            <Panel title="Countries" description="From Cloudflare, when the API runs behind it."><RankedList items={summary.countries} empty="No country data yet." /></Panel>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminHome() {
  return (
    <AdminShell title="Traffic">
      <Dashboard />
    </AdminShell>
  );
}
