import { Award as AwardIcon, ExternalLink } from 'lucide-react';
import type { Award } from '@/data/awards';

/** A small award badge linking to its certificate (footer and About). */
export function AwardBadge({ award }: { award: Award }) {
  return (
    <a
      href={award.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${award.body} ${award.title}: ${award.project}, ${award.month}. Opens the certificate.`}
      className="tap group inline-flex items-center gap-2.5 rounded-full border border-[hsl(var(--sys-orange)/0.45)] bg-[hsl(var(--sys-orange)/0.08)] py-1.5 pl-1.5 pr-3.5 text-left transition-colors hover:bg-[hsl(var(--sys-orange)/0.16)]"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--sys-orange))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
        <AwardIcon className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--sys-orange))]">{award.body}</span>
        <span className="block text-xs font-semibold text-foreground">
          {award.title} · {award.month.replace(/^(\w{3})\w* /, '$1 ')}
        </span>
      </span>
      <ExternalLink aria-hidden className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
    </a>
  );
}
