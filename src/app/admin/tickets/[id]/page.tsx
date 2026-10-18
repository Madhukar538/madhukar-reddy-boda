'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Mail, Phone } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import { TICKET_STATUS_LABELS, type Ticket, type TicketPriority, type TicketStatus } from '@/lib/admin/types';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { PriorityChip, StatusChip } from '@/components/admin/ticket-badges';
import { Field, Notice, Panel, Spinner, fieldClass, formatDateTime } from '@/components/admin/ui';

const STATUSES = Object.keys(TICKET_STATUS_LABELS) as TicketStatus[];
const PRIORITIES: TicketPriority[] = ['P1', 'P2', 'P3', 'P4'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s()-]{7,}$/;
// Visitor-supplied: only ever linked when it is plainly a web address or a path on this site.
const WEB_URL = /^https?:\/\//i;
const SITE_PATH = /^\/(?!\/)/;

/** How to reach the person: an email or phone link when the contact looks like one. */
function ContactLink({ contact, subject }: { contact: string; subject: string }) {
  if (EMAIL.test(contact)) {
    return (
      <a href={`mailto:${contact}?subject=${encodeURIComponent(subject)}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
        <Mail className="h-4 w-4" /> {contact}
      </a>
    );
  }
  if (PHONE.test(contact)) {
    return (
      <a href={`tel:${contact.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
        <Phone className="h-4 w-4" /> {contact}
      </a>
    );
  }
  return <span>{contact || '—'}</span>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}

function TicketDetail({ id }: { id: string }) {
  const { call } = useAdmin();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loadError, setLoadError] = useState('');
  const [status, setStatus] = useState<TicketStatus>('open');
  const [priority, setPriority] = useState<TicketPriority>('P4');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const t = await call<Ticket>('GetTicket', { id });
      setTicket(t);
      setStatus(t.status);
      setPriority(t.priority);
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, [call, id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loadError) return <Notice>{loadError}</Notice>;
  if (!ticket) return <Spinner />;

  const isChanged = status !== ticket.status || priority !== ticket.priority || note.trim().length > 0;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await call('UpdateTicket', {
        id,
        status: status !== ticket.status ? status : '',
        priority: priority !== ticket.priority ? priority : '',
        note: note.trim(),
      });
      setNote('');
      setMessage({ kind: 'success', text: 'Saved.' });
      await load();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Link href="/admin/tickets" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> All tickets
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityChip priority={ticket.priority} />
          <StatusChip status={ticket.status} />
          <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{ticket.title}</h2>
        <p className="text-sm text-muted-foreground">
          Filed {formatDateTime(ticket.createdAt)} by {ticket.name}
          {ticket.resolvedAt && <> · resolved {formatDateTime(ticket.resolvedAt)}</>}
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Panel title="What they wrote">
            <p className="whitespace-pre-line break-words text-[15px] leading-relaxed">{ticket.description}</p>
          </Panel>

          <Panel title="Details">
            <dl className="divide-y divide-foreground/10">
              <Row label="Contact"><ContactLink contact={ticket.contact} subject={`Re: ${ticket.title} [${ticket.id}]`} /></Row>
              <Row label="Category">{ticket.category}</Row>
              <Row label="Urgency">{ticket.urgency || '—'}</Row>
              {ticket.stack && <Row label="Stack">{ticket.stack}</Row>}
              {ticket.link && (
                <Row label="Link">
                  {!WEB_URL.test(ticket.link) ? ticket.link : <a href={ticket.link} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-primary hover:underline">
                    {ticket.link} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>}
                </Row>
              )}
              {ticket.page && (
                <Row label="Filed from">
                  {SITE_PATH.test(ticket.page) ? (
                    <a href={ticket.page} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{ticket.page}</a>
                  ) : (
                    ticket.page
                  )}
                </Row>
              )}
              <Row label="Triage">{ticket.triageReasons.length ? ticket.triageReasons.join(', ') : '—'}</Row>
            </dl>
          </Panel>

          <Panel title="Timeline" description="Status changes and notes, oldest first.">
            {ticket.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <ol className="space-y-3">
                {ticket.notes.map((n, i) => (
                  <li key={i} className="glass-inset rounded-xl px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(n.at)} · {n.by}
                    </p>
                    <p className="mt-1 whitespace-pre-line break-words text-sm">{n.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <form onSubmit={save} className="lg:sticky lg:top-28">
          <Panel title="Manage">
            <div className="space-y-4">
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className={fieldClass}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{TICKET_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className={fieldClass}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Add a note" hint={`${note.length}/2000`}>
                <textarea rows={4} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you found, what you replied, what's next…" className={`${fieldClass} resize-y`} />
              </Field>
              <button type="submit" disabled={busy || !isChanged} className="tinted-button w-full justify-center disabled:opacity-50">
                {busy ? 'Saving…' : 'Save'}
              </button>
              {message && <Notice kind={message.kind}>{message.text}</Notice>}
            </div>
          </Panel>
        </form>
      </div>
    </div>
  );
}

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminShell title="Ticket">
      <TicketDetail id={decodeURIComponent(id)} />
    </AdminShell>
  );
}
