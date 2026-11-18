import type { Metadata } from 'next';
import { pageOpenGraph } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/portfolio/page-shell';
import { bugLog } from '@/data/bug-log';

export const metadata: Metadata = {
  alternates: { canonical: '/bug-log' },
  openGraph: pageOpenGraph('/bug-log'),
  title: 'Bug log — Boda Madhukar Reddy',
  description: 'Bugs I have fixed: what people saw, why it happened, what changed and what it measured afterwards.',
};

/** The public log of fixed bugs (src/data/bug-log.ts); a 404 until it has entries. */
export default function BugLogPage() {
  if (bugLog.length === 0) notFound();
  return (
    <PageShell
      eyebrow={`${bugLog.length} ${bugLog.length === 1 ? 'bug' : 'bugs'} fixed`}
      title="The bug log."
      description="Real fixes, each with the symptom, the root cause, the change and the result."
      actions={
        <Link href="/fix-a-bug" className="tinted-button">
          Bring me yours <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      <ol className="bug-log space-y-5">
        {bugLog.map((bug, i) => (
          <li key={bug.title} className="glass p-6 md:p-8">
            <p className="font-mono text-xs text-muted-foreground">
              #{String(bugLog.length - i).padStart(3, '0')} · {bug.when} · {bug.stack}
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">{bug.title}</h2>
            <dl className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ['Symptom', bug.symptom],
                ['Root cause', bug.cause],
                ['Fix', bug.fix],
              ].map(([label, text]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed">{text}</dd>
                </div>
              ))}
            </dl>
            {bug.result && <p className="mt-5 border-t border-foreground/10 pt-4 font-semibold text-primary">{bug.result}</p>}
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
