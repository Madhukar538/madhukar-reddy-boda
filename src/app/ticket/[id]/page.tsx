import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { PageShell } from '@/components/portfolio/page-shell';

/**
 * A reporter's private page for their ticket: /ticket/<id>?k=<secret>. The secret comes from
 * the link shown after filing (the API stores only its hash), so the page is never indexed,
 * never cached, and never sends the link on to other sites (Referrer-Policy: no-referrer).
 * Only what the reporter may see comes back: status, dates and the notes shared with them.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your ticket — Boda Madhukar Reddy',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type TicketStatus = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  timeline: { at: string; text: string }[];
};

const STEPS = [
  { status: 'open', label: 'Received' },
  { status: 'in-progress', label: 'Looking into it' },
  { status: 'resolved', label: 'Fixed' },
] as const;

async function loadStatus(id: string, token: string): Promise<TicketStatus | null> {
  const base = (process.env.API_URL || '').replace(/\/$/, '');
  if (!base || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) return null;
  try {
    const response = await fetch(`${base}/api/GetTicketStatus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { returnCode: number; data: TicketStatus };
    return json.returnCode === 1 ? json.data : null;
  } catch {
    return null;
  }
}

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST';

export default async function TicketStatusPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { id } = await params;
  const k = (await searchParams).k;
  const ticket = await loadStatus(decodeURIComponent(id), typeof k === 'string' ? k : '');
  if (!ticket) notFound();

  const closed = ticket.status === 'closed';
  const reached = closed ? STEPS.length : STEPS.findIndex((s) => s.status === ticket.status) + 1;

  return (
    <PageShell eyebrow={`Ticket ${ticket.id}`} title={ticket.title} description={`${ticket.category} · ${ticket.priority} · filed ${when(ticket.createdAt)}`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] items-start">
        <div className="space-y-6">
          <ol className="ticket-steps glass grid grid-cols-3" aria-label="Progress">
            {STEPS.map((step, i) => {
              const done = i < reached;
              const current = !closed && i === reached - 1;
              return (
                <li key={step.status} className="ticket-step p-4 md:p-5" data-done={done ? '' : undefined} aria-current={current ? 'step' : undefined}>
                  <span className="ticket-step-mark" aria-hidden>
                    {done ? <Check className="h-4 w-4" /> : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="mt-2 block text-sm font-semibold">{step.label}</span>
                </li>
              );
            })}
          </ol>
          {closed && <p className="text-sm text-muted-foreground">This ticket is closed. If the problem is back, file a new one and mention {ticket.id}.</p>}

          <section aria-labelledby="ticket-timeline" className="glass p-6 md:p-8">
            <h2 id="ticket-timeline" className="text-xl font-bold">What&apos;s happened</h2>
            <ol className="mt-5 space-y-4 border-l border-foreground/15 pl-5">
              {ticket.timeline.map((e, i) => (
                <li key={i} className="relative">
                  <span aria-hidden className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="font-mono text-xs text-muted-foreground">{when(e.at)}</p>
                  <p className="mt-1 whitespace-pre-line break-words text-[15px] text-foreground">{e.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="glass p-5 space-y-3 text-sm">
          <p className="font-semibold">Keep this link private</p>
          <p className="text-muted-foreground">Anyone with it can see this page. It shows the status only: never your contact details or the description you sent.</p>
          <p className="text-muted-foreground">Last update {when(ticket.updatedAt)}.</p>
          <Link href="/fix-a-bug" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Report something else <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}
