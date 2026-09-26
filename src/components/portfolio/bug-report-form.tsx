'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Bug, Check, Copy, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES, URGENCIES } from '@/lib/bug-report-options';

type Status =
  | { state: 'idle' }
  | { state: 'sending' }
  | { state: 'error'; message: string; fields?: Record<string, string> }
  | { state: 'sent'; ticket: string; priority?: string };

const fieldClass =
  'w-full rounded-2xl bg-foreground/[0.04] dark:bg-white/[0.05] px-4 py-3 text-[0.95rem] text-foreground placeholder:text-muted-foreground/70 ring-1 ring-foreground/10 outline-none transition focus:ring-2 focus:ring-primary';

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between gap-3 text-sm font-semibold text-foreground">
        {label}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
      {error && <span className="block text-xs font-medium text-destructive">{error}</span>}
    </label>
  );
}

function Choice<T extends string>({ name, options, value, onChange }: { name: string; options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-all active:scale-95',
            value === option
              ? 'bg-primary text-primary-foreground ring-primary'
              : 'ring-foreground/15 text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function BugReportForm() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Bug');
  const [urgency, setUrgency] = useState<(typeof URGENCIES)[number]>('This week');
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [copied, setCopied] = useState(false);
  const startedAt = useRef(0);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    // Arriving from a blog post (?topic=<post title>) pre-fills the title.
    const topic = new URLSearchParams(window.location.search).get('topic')?.trim();
    if (topic && titleRef.current && !titleRef.current.value) titleRef.current.value = `Help with: ${topic}`.slice(0, 120);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      ...Object.fromEntries(['name', 'contact', 'stack', 'title', 'description', 'link', 'website'].map((k) => [k, String(form.get(k) ?? '')])),
      category,
      urgency,
      startedAt: startedAt.current,
    };
    setStatus({ state: 'sending' });
    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ticket) setStatus({ state: 'sent', ticket: data.ticket, priority: data.priority });
      else setStatus({ state: 'error', message: data.error ?? 'Something went wrong. Please try again.', fields: data.fields });
    } catch {
      setStatus({ state: 'error', message: "You seem to be offline. Please try again when you're connected." });
    }
  }

  if (status.state === 'sent') {
    return (
      <div className="glass p-8 md:p-10 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--sys-green))] text-white shadow-lg">
          <Check className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ticket filed</h2>
          <p className="text-muted-foreground">It&apos;s on my phone now. I&apos;ll reply on the contact you gave.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(status.ticket);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="glass-inset mx-auto inline-flex items-center gap-3 px-5 py-3 font-mono text-lg font-semibold tracking-wider"
          title="Copy ticket ID"
        >
          {status.ticket}
          {copied ? <Check className="h-4 w-4 text-[hsl(var(--sys-green))]" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>
        {status.priority && <p className="text-sm text-muted-foreground">Triaged as <span className="font-semibold text-foreground">{status.priority}</span></p>}
        <button type="button" onClick={() => setStatus({ state: 'idle' })} className="text-sm font-medium text-primary hover:underline">
          Report another issue
        </button>
      </div>
    );
  }

  const sending = status.state === 'sending';
  const fields = status.state === 'error' ? status.fields ?? {} : {};

  return (
    <form onSubmit={onSubmit} className="glass p-6 md:p-8 space-y-6" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Your name" error={fields.name}>
          <input name="name" required autoComplete="name" className={fieldClass} placeholder="Ada Lovelace" />
        </Field>
        <Field label="Reply to" hint="Email or Telegram @handle" error={fields.contact}>
          <input name="contact" required autoComplete="email" className={fieldClass} placeholder="you@company.com" />
        </Field>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-semibold">What kind of help?</span>
        <Choice name="Category" options={CATEGORIES} value={category} onChange={setCategory} />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-semibold">How urgent?</span>
        <Choice name="Urgency" options={URGENCIES} value={urgency} onChange={setUrgency} />
      </div>

      <Field label="Title" error={fields.title}>
        <input ref={titleRef} name="title" required maxLength={120} className={fieldClass} placeholder="Checkout API times out under load" />
      </Field>

      <Field label="What's happening?" hint="Symptoms, errors, what you expected" error={fields.description}>
        <textarea
          name="description"
          required
          rows={6}
          maxLength={4000}
          className={cn(fieldClass, 'resize-y min-h-[9rem]')}
          placeholder={'Since Monday, /api/checkout returns 504 at ~200 req/s.\nStack trace: …\nExpected: p95 under 300 ms.'}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Tech stack" hint="Optional" error={fields.stack}>
          <input name="stack" maxLength={120} className={fieldClass} placeholder=".NET 8, SQL Server, Redis" />
        </Field>
        <Field label="Link" hint="Repo, issue or screenshot (optional)" error={fields.link}>
          <input name="link" type="url" inputMode="url" maxLength={300} className={fieldClass} placeholder="https://github.com/…" />
        </Field>
      </div>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      {status.state === 'error' && (
        <p role="alert" className="glass-inset px-4 py-3 text-sm font-medium text-destructive">
          {status.message}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <p className="text-xs text-muted-foreground max-w-sm">
          Goes straight to my phone. Your details are only used to reply to you.
        </p>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-70"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Filing ticket…' : 'File the ticket'}
        </button>
      </div>
    </form>
  );
}

/** Small "how it works" strip shown beside the form. */
export function BugProcess({ email }: { email: string }) {
  const steps = [
    { title: 'Describe it', body: 'Symptoms, errors and your stack. Rough notes are fine.' },
    { title: 'Auto-triage', body: 'The report is scored P1–P4 from urgency and impact signals.' },
    { title: 'I get pinged', body: 'It lands on my phone via Telegram as a ticket.' },
    { title: 'We fix it', body: "I reply with next steps: a quick answer, a call or a proper fix." },
  ];
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {steps.map((s, i) => (
        <li key={s.title} className="glass p-5 flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {i === 0 ? <Bug className="h-4 w-4" /> : i + 1}
          </span>
          <div>
            <p className="font-semibold">{s.title}</p>
            <p className="text-sm text-muted-foreground">{s.body}</p>
          </div>
        </li>
      ))}
      <li className="hidden lg:flex items-center gap-2 px-2 text-sm text-muted-foreground">
        Prefer email?{' '}
        <a href={`mailto:${email}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          Write to me <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </li>
    </ol>
  );
}
