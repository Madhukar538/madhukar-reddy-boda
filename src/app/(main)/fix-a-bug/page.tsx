import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { BugProcess, BugReportForm } from '@/components/portfolio/bug-report-form';
import Link from 'next/link';
import { CalendarClock, ListChecks } from 'lucide-react';
import { getContent } from '@/lib/content';
import { bookingUrl } from '@/lib/booking';
import { bugLog } from '@/data/bug-log';

/** The kinds of trouble that come in, for the Editorial band under the title. */
const TROUBLE = ['Stack traces', '504s under load', 'Slow queries', 'Memory leaks', 'Race conditions', 'Flaky deploys', 'Broken integrations', 'Hallucinating agents'];

export const metadata: Metadata = {
  alternates: { canonical: '/fix-a-bug' },
  title: 'Fix a bug — Boda Madhukar Reddy',
  description:
    'Stuck on a bug, a slow API or an architecture question? Describe it and it becomes a triaged ticket on my phone.',
};

export default async function FixABugPage() {
  const { profile } = await getContent();
  const booking = bookingUrl();
  // Shown only when there is something real behind them (a booking link, logged fixes).
  const actions =
    booking || bugLog.length > 0 ? (
      <>
        {booking && (
          <a href={booking} target="_blank" rel="noopener noreferrer" className="tinted-button">
            <CalendarClock className="h-4 w-4" /> Book a 30-minute debug call
          </a>
        )}
        {bugLog.length > 0 && (
          <Link href="/bug-log" className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-4 py-2 text-sm font-medium">
            <ListChecks className="h-4 w-4" /> {bugLog.length} {bugLog.length === 1 ? 'bug' : 'bugs'} fixed: see the log
          </Link>
        )}
      </>
    ) : undefined;
  return (
    <PageShell
      eyebrow="Hire me for a bug"
      title="Got a bug? Send it my way."
      description="I work full-time at Revalsys, and on the side I help teams fix stubborn bugs, slow APIs and shaky architecture. Describe the problem and it becomes a ticket on my phone."
      actions={actions}
    >
      <div className="ed-only ed-ticker ed-trouble" aria-hidden>
        <div className="ed-ticker-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="ed-ticker-run">
              {TROUBLE.map((t) => (
                <span key={t}>
                  {t}
                  <i>✶</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div className="bug-desk grid gap-6 lg:grid-cols-[1fr_18rem] items-start">
        <BugReportForm />
        <BugProcess email={profile.email} />
      </div>
    </PageShell>
  );
}
