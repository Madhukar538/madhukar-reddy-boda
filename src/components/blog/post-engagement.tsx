'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Eye, Loader2, MessageSquare, Send, TrendingUp } from 'lucide-react';
import {
  REACTIONS,
  addComment,
  compactNumber,
  engagementEnabled,
  loadEngagement,
  loadPopular,
  myReactions,
  react,
  saveMyReactions,
  type Engagement,
  type PopularPost,
  type ReactionKey,
} from '@/lib/engagement';
import { cn } from '@/lib/utils';

/** The post's shared engagement data (one request per page), or null while loading or unavailable. */
function useEngagement(slug: string) {
  const [data, setData] = useState<Engagement | null>(null);
  useEffect(() => {
    if (!engagementEnabled) return;
    let alive = true;
    loadEngagement(slug).then((d) => alive && setData(d)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);
  return [data, setData] as const;
}

/** "1.2k reads", shown in the post's properties once known. */
export function ReadCount({ slug }: { slug: string }) {
  const [data] = useEngagement(slug);
  if (!engagementEnabled) return null;
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <Eye aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
      {data ? `${compactNumber(data.reads)} ${data.reads === 1 ? 'read' : 'reads'}` : '…'}
    </span>
  );
}

/** A row of reactions. Counts update at once; this browser remembers what you picked. */
export function Reactions({ slug }: { slug: string }) {
  const [data, setData] = useEngagement(slug);
  const [mine, setMine] = useState<ReactionKey[]>([]);
  useEffect(() => setMine(myReactions(slug)), [slug]);
  if (!engagementEnabled) return null;

  const toggle = (key: ReactionKey) => {
    const isAdded = !mine.includes(key);
    const next = isAdded ? [...mine, key] : mine.filter((k) => k !== key);
    setMine(next);
    saveMyReactions(slug, next);
    setData((d) => (d ? { ...d, reactions: { ...d.reactions, [key]: Math.max(0, d.reactions[key] + (isAdded ? 1 : -1)) } } : d));
    react(slug, key, isAdded).catch(() => {
      // Put it back if the API refused (rate limit or offline).
      setMine(mine);
      saveMyReactions(slug, mine);
      setData((d) => (d ? { ...d, reactions: { ...d.reactions, [key]: Math.max(0, d.reactions[key] + (isAdded ? -1 : 1)) } } : d));
    });
  };

  return (
    <div role="group" aria-label="React to this post" className="flex flex-wrap gap-2">
      {REACTIONS.map(({ key, emoji, label }) => {
        const isOn = mine.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            aria-pressed={isOn}
            title={label}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium ring-1 transition-colors tabular-nums',
              isOn ? 'bg-primary/15 text-foreground ring-primary/50' : 'text-foreground/75 ring-foreground/15 hover:bg-foreground/10 hover:text-foreground',
            )}
          >
            <span aria-hidden className="text-base leading-none">{emoji}</span>
            <span className="sr-only">{label}</span>
            {data ? compactNumber(data.reactions[key] ?? 0) : '·'}
          </button>
        );
      })}
    </div>
  );
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function timeAgo(iso: string) {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  return 'just now';
}

const MAX_BODY = 2000;

/** Approved comments, and a form whose comments wait for approval before they appear. */
export function Comments({ slug }: { slug: string }) {
  const [data] = useEngagement(slug);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<{ kind: 'sent' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const shownAt = useRef(0);
  const website = useRef<HTMLInputElement>(null);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);
  if (!engagementEnabled) return null;

  const comments = data?.comments ?? [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await addComment({ slug, name, body, website: website.current?.value ?? '', elapsedMs: Date.now() - shownAt.current });
      setStatus({ kind: 'sent', text: 'Thanks! Your comment will appear once it is approved.' });
      setBody('');
    } catch (err) {
      setStatus({ kind: 'error', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-xl bg-foreground/[0.04] px-3.5 py-2.5 text-[15px] ring-1 ring-foreground/15 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/60';

  return (
    <section id="comments" aria-labelledby="comments-heading" className="scroll-mt-28">
      <h2 id="comments-heading" className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight">
        <MessageSquare aria-hidden className="h-5 w-5 text-primary" />
        {comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}` : 'Comments'}
      </h2>

      {comments.length > 0 ? (
        <ol className="mb-6 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="glass-inset rounded-2xl px-4 py-3.5">
              <p className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold text-foreground">{c.name}</span>
                <time dateTime={c.createdAt} className="shrink-0 text-xs text-muted-foreground" suppressHydrationWarning>
                  {timeAgo(c.createdAt)}
                </time>
              </p>
              <p className="mt-1.5 whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground/90">{c.body}</p>
            </li>
          ))}
        </ol>
      ) : (
        data && <p className="mb-5 text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
      )}

      <form onSubmit={submit} className="space-y-3">
        {/* Hidden from people; bots that fill every field give themselves away. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input ref={website} type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="block">
          <span className="sr-only">Your name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="Your name" autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className="sr-only">Your comment</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            minLength={2}
            maxLength={MAX_BODY}
            rows={4}
            placeholder="Share a thought, a question or what worked for you…"
            className={cn(field, 'resize-y')}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Comments appear after a quick review. No email or account needed.</p>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted-foreground">{body.length}/{MAX_BODY}</span>
            <button type="submit" disabled={busy || !name.trim() || body.trim().length < 2} className="tinted-button !px-4 !py-2 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post comment
            </button>
          </div>
        </div>
        {status && (
          <p role="status" className={cn('text-sm', status.kind === 'sent' ? 'text-[hsl(var(--sys-green))]' : 'text-destructive')}>
            {status.text}
          </p>
        )}
      </form>
    </section>
  );
}

/** The most-read posts (optionally leaving out the one being read). */
export function PopularPosts({ exclude, className }: { exclude?: string; className?: string }) {
  const [posts, setPosts] = useState<PopularPost[] | null>(null);
  useEffect(() => {
    if (!engagementEnabled) return;
    let alive = true;
    loadPopular().then((p) => alive && setPosts(p)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const list = (posts ?? []).filter((p) => p.slug !== exclude).slice(0, 5);
  if (!engagementEnabled || list.length === 0) return null;

  return (
    <section aria-labelledby="popular-heading" className={cn('glass p-4', className)}>
      <h2 id="popular-heading" className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <TrendingUp aria-hidden className="h-3.5 w-3.5" /> Most read
      </h2>
      <ol className="space-y-0.5">
        {list.map((p, i) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="group flex gap-3 rounded-xl px-2 py-2 hover:bg-foreground/5 transition-colors">
              <span className="w-4 shrink-0 text-sm font-bold tabular-nums text-primary">{i + 1}</span>
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors">{p.title}</span>
                <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">{compactNumber(p.reads)} {p.reads === 1 ? 'read' : 'reads'}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
