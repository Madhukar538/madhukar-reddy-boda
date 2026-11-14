import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { nowDate } from '@/lib/utils';

/** The agent team, as `hc ls` would list it. */
const TEAM = [
  { name: 'lead', tool: 'claude-code' },
  { name: 'dev', tool: 'antigravity ×5' },
  { name: 'review', tool: 'copilot' },
  { name: 'review²', tool: 'codex' },
];

/**
 * "Now" as an agent console: a terminal title bar, the team that is running,
 * the current focus and the latest post. Closes the hero, under the metrics.
 */
export function NowCard({ now, updatedAt, latest }: { now: string; updatedAt: string | null; latest?: { slug: string; title: string } }) {
  const updated = nowDate(updatedAt);
  return (
    <aside aria-labelledby="now-heading" className="now-card agent-console glass">
      <div className="agent-console-bar">
        <span aria-hidden className="agent-console-lights"><span /><span /><span /></span>
        <span aria-hidden className="now-pulse" />
        <p id="now-heading" className="agent-console-title">
          now<span aria-hidden> — </span><span className="sr-only">: </span>running
        </p>
        {updated && <span className="agent-console-meta">updated {updated}</span>}
      </div>

      <div className="px-4 py-3.5 sm:px-5">
        <p className="agent-console-cmd flex items-baseline justify-between gap-3">
          <span><span aria-hidden className="text-primary">$ </span>hc ls</span>
          <span className="agent-console-meta !ml-0">4 roles · 9 sessions</span>
        </p>
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {TEAM.map((agent) => (
            <li key={agent.name} className="agent-console-agent">
              <span aria-hidden className="agent-console-led" />
              <span className="text-muted-foreground">{agent.name}</span> {agent.tool}
            </li>
          ))}
        </ul>

        <div className="mt-3.5 grid gap-3 border-t border-foreground/10 pt-3.5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
          <p className="min-w-0 text-sm leading-relaxed text-foreground/90">{now}</p>
          {latest && (
            <Link
              href={`/blog/${latest.slug}`}
              className="group block border-t border-foreground/10 pt-3 sm:max-w-[17rem] sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"
            >
              <span className="agent-console-meta block">latest post</span>
              <span className="mt-1 flex items-start gap-1 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                <span className="line-clamp-3">{latest.title}</span>
                <ArrowUpRight aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
