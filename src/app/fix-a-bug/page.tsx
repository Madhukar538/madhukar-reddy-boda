import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { BugProcess, BugReportForm } from '@/components/portfolio/bug-report-form';
import { getContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Fix a bug — Boda Madhukar Reddy',
  description:
    'Stuck on a bug, a slow API or an architecture question? Describe it and it becomes a triaged ticket on my phone.',
};

export default async function FixABugPage() {
  const { profile } = await getContent();
  return (
    <PageShell
      eyebrow="Hire me for a bug"
      title="Got a bug? Send it my way."
      description="I work full-time at Revalsys, and on the side I help teams fix stubborn bugs, slow APIs and shaky architecture. Describe the problem and it becomes a ticket on my phone."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] items-start">
        <BugReportForm />
        <BugProcess email={profile.email} />
      </div>
    </PageShell>
  );
}
