import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Small building blocks shared by the admin pages, in the site's glass style. */

export const fieldClass =
  'w-full rounded-xl bg-foreground/[0.04] dark:bg-white/[0.05] px-3.5 py-2.5 text-[0.95rem] text-foreground placeholder:text-muted-foreground/70 ring-1 ring-foreground/10 outline-none transition focus:ring-2 focus:ring-primary disabled:opacity-60';

export const secondaryButton =
  'glass glass-pill glass-interactive inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:pointer-events-none';

export const dangerButton =
  'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[hsl(var(--destructive))] ring-1 ring-[hsl(var(--destructive)/0.35)] hover:bg-[hsl(var(--destructive)/0.1)] transition disabled:opacity-50 disabled:pointer-events-none';

export function Field({ label, hint, className, children }: { label: string; hint?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Notice({ kind = 'error', children }: { kind?: 'error' | 'success'; children: ReactNode }) {
  const Icon = kind === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm',
        kind === 'error' ? 'bg-[hsl(var(--destructive)/0.1)] text-foreground' : 'bg-primary/10 text-foreground'
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', kind === 'error' ? 'text-[hsl(var(--destructive))]' : 'text-primary')} />
      <span>{children}</span>
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground" role="status">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}…
    </div>
  );
}

export function Panel({ title, description, actions, children, className }: { title?: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('glass p-5 md:p-6', className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-bold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** "a, b, c" ⇄ ["a", "b", "c"] for tag-like fields. */
export const splitList = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** One item per line ⇄ string[] for bullet lists. */
export const splitLines = (value: string) =>
  value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
