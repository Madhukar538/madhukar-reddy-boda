import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, FileText } from 'lucide-react';
import type { NoteLink, NoteType } from '@/lib/vault';

// Same colours as the graph, so a row reads like its node. A dot, not an
// icon: these lists repeat per row and icons would bloat every post page.
const DOT: Partial<Record<NoteType, string>> = {
  post: 'bg-[hsl(var(--sys-teal))]',
  project: 'bg-primary',
  client: 'bg-primary',
  lab: 'bg-[hsl(var(--sys-purple))]',
  topic: 'bg-[hsl(var(--sys-orange))]',
};

function NoteList({ items }: { items: NoteLink[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-foreground/[0.06]"
          >
            <span aria-hidden className={`mt-[0.45rem] h-2 w-2 shrink-0 rounded-full ${DOT[item.type] ?? 'bg-muted-foreground'}`} />
            <span className="min-w-0">
              <span className="block font-medium text-foreground group-hover:text-primary leading-snug">
                {item.type === 'topic' ? `#${item.title}` : item.title}
              </span>
              {item.via && (
                <span className="block text-xs text-muted-foreground">shares {item.via.map((v) => `#${v}`).join(' ')}</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Pane({ title, count, icon: Icon, children }: { title: string; count: number; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
        <span className="ml-auto rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] tabular-nums normal-case tracking-normal">{count}</span>
      </p>
      {children}
    </div>
  );
}

/**
 * Obsidian's backlinks and outgoing-links panes: what points at this note,
 * notes that mention the same things, and where this note links to.
 */
export function LinkedMentions({ backlinks, mentions, outgoing }: { backlinks: NoteLink[]; mentions: NoteLink[]; outgoing: NoteLink[] }) {
  return (
    <section id="linked-mentions" aria-label="Linked notes" className="glass-inset scroll-mt-28 p-4 md:p-5" data-previews>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5">
          <Pane title="Linked mentions" count={backlinks.length} icon={ArrowDownLeft}>
            {backlinks.length ? (
              <NoteList items={backlinks} />
            ) : (
              <p className="px-2 text-sm text-muted-foreground">No project or experiment links here yet.</p>
            )}
          </Pane>
          {mentions.length > 0 && (
            <Pane title="Unlinked mentions" count={mentions.length} icon={FileText}>
              <NoteList items={mentions} />
            </Pane>
          )}
        </div>
        <Pane title="Outgoing links" count={outgoing.length} icon={ArrowUpRight}>
          <NoteList items={outgoing} />
        </Pane>
      </div>
    </section>
  );
}
