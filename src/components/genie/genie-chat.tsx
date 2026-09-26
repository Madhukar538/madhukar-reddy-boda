'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Check, Copy, Loader2, Mail, RotateCcw, SendHorizontal, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES, URGENCIES } from '@/lib/bug-report-options';

/**
 * A guided conversation that ends in a ticket: one question at a time, with
 * tap-to-answer chips where there are fixed choices. Answers are checked with
 * the same rules as the server, so nothing is rejected after the last step.
 * The ticket goes to /api/bug-report, which sends it to Telegram.
 */

type Category = (typeof CATEGORIES)[number];
type Urgency = (typeof URGENCIES)[number];
type Answers = {
  category?: Category;
  title?: string;
  description?: string;
  urgency?: Urgency;
  stack?: string;
  link?: string;
  name?: string;
  contact?: string;
};
type Field = keyof Answers;
type Message = { id: number; from: 'genie' | 'you'; text: string };
type Phase = 'asking' | 'review' | 'sending' | 'done' | 'error';

type Step = {
  field: Field;
  ask: string;
  /** Fixed answers shown as chips; with no input, one of them must be picked. */
  chips?: readonly { label: string; value: string }[];
  input?: 'text' | 'textarea' | 'email';
  placeholder?: string;
  optional?: boolean;
  max: number;
  check: (value: string) => string | null;
};

const CATEGORY_LABELS: Record<Category, string> = {
  Bug: '🐞 Something is broken',
  Performance: '🐢 It’s too slow',
  'Architecture review': '🏗️ Architecture advice',
  'Integration / API': '🔌 An API or integration',
  Other: '💬 Something else',
};

const STEPS: Step[] = [
  {
    field: 'category',
    ask: 'Hi, I’m the genie here 🧞 Stuck on something? Tell me about it and I’ll put a ticket straight on Madhukar’s phone. What kind of problem is it?',
    chips: CATEGORIES.map((c) => ({ label: CATEGORY_LABELS[c], value: c })),
    max: 40,
    check: () => null,
  },
  {
    field: 'title',
    ask: 'Give it a one-line title.',
    input: 'text',
    placeholder: 'Checkout API times out under load',
    max: 120,
    check: (v) => (v.length < 6 ? 'A few more words, please: at least 6 characters.' : null),
  },
  {
    field: 'description',
    ask: 'What’s happening? What did you expect, what happened instead, and any error message you saw.',
    input: 'textarea',
    placeholder: 'After deploying, p95 latency went from 200 ms to 4 s…',
    max: 4000,
    check: (v) => (v.length < 20 ? 'Tell me a little more, at least 20 characters, so the ticket makes sense.' : null),
  },
  {
    field: 'urgency',
    ask: 'How urgent is it?',
    chips: URGENCIES.map((u) => ({ label: u === 'Urgent (production)' ? '🔥 Urgent (production)' : u, value: u })),
    max: 40,
    check: () => null,
  },
  {
    field: 'stack',
    ask: 'What’s it built with? This one’s optional.',
    input: 'text',
    placeholder: '.NET 8, SQL Server, Redis',
    optional: true,
    max: 120,
    check: () => null,
  },
  {
    field: 'link',
    ask: 'A link that helps, like a repo, a page or a log? Also optional.',
    input: 'text',
    placeholder: 'https://…',
    optional: true,
    max: 300,
    check: (v) => (v && !/^https?:\/\/\S+$/.test(v) ? 'Links need to start with http:// or https://.' : null),
  },
  {
    field: 'name',
    ask: 'Nearly done. What’s your name?',
    input: 'text',
    placeholder: 'Your name',
    max: 80,
    check: (v) => (v.length < 2 ? 'Please add your name.' : null),
  },
  {
    field: 'contact',
    ask: 'Where should Madhukar reply? An email or a Telegram @handle.',
    input: 'email',
    placeholder: 'you@company.com or @handle',
    max: 120,
    check: (v) =>
      /^\S+@\S+\.\S+$/.test(v) || /^@?[A-Za-z0-9_]{5,32}$/.test(v) ? null : 'That doesn’t look like an email or a Telegram @handle.',
  },
];

const STORAGE_KEY = 'genie-chat-v1';
type Saved = { messages: Message[]; answers: Answers; step: number; phase: Phase; ticket?: string; priority?: string; startedAt: number };

const readSaved = (): Saved | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
};

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Keeps the phone sheet above the on-screen keyboard (iOS doesn't resize the layout for it). */
function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState({ bottom: 0, height: 0 });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setInset({ bottom: Math.max(0, window.innerHeight - vv.height - vv.offsetTop), height: vv.height });
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [active]);
  return inset;
}

function useIsPhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return phone;
}

function Orb({ small }: { small?: boolean }) {
  return (
    <span aria-hidden className={cn('genie-orb flex shrink-0 items-center justify-center rounded-full text-white', small ? 'h-7 w-7' : 'h-10 w-10')}>
      <Sparkles className={small ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
    </span>
  );
}

export function GenieChat({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  const pathname = usePathname() ?? '/';
  const phone = useIsPhone();
  const keyboard = useKeyboardInset(open && phone);

  const [messages, setMessages] = useState<Message[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('asking');
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState('');
  const [ticket, setTicket] = useState<{ id: string; priority?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const startedAt = useRef(Date.now());
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  const say = useCallback((from: Message['from'], text: string) => {
    setMessages((m) => [...m, { id: nextId.current++, from, text }]);
  }, []);

  /** The genie "types" briefly before speaking, so the conversation reads naturally. */
  const genieSays = useCallback(
    (text: string, then?: () => void) => {
      if (reducedMotion()) {
        say('genie', text);
        then?.();
        return;
      }
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        say('genie', text);
        then?.();
      }, 420);
    },
    [say]
  );

  // Pick up where the visitor left off in this tab, or start the conversation.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = readSaved();
    if (saved && saved.messages.length) {
      setMessages(saved.messages);
      setAnswers(saved.answers);
      setStep(saved.step);
      setPhase(saved.phase === 'sending' || saved.phase === 'error' ? 'review' : saved.phase);
      if (saved.ticket) setTicket({ id: saved.ticket, priority: saved.priority });
      startedAt.current = saved.startedAt;
      nextId.current = Math.max(...saved.messages.map((m) => m.id)) + 1;
      // Left while the genie was about to reply: ask the pending question again, or go to the review.
      const last = saved.messages[saved.messages.length - 1];
      if (saved.phase === 'asking' && last.from === 'you') {
        const answeredAll = saved.answers[STEPS[saved.step].field] !== undefined;
        if (answeredAll) genieSays('Here’s your ticket. Send it when you’re happy with it.', () => setPhase('review'));
        else genieSays(STEPS[saved.step].ask);
      }
    } else {
      genieSays(STEPS[0].ask);
    }
  }, [genieSays]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages, answers, step, phase, ticket: ticket?.id, priority: ticket?.priority, startedAt: startedAt.current } satisfies Saved)
      );
    } catch {}
  }, [messages, answers, step, phase, ticket]);

  // Keep the newest message in view.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, typing, phase, open]);

  const current = phase === 'asking' ? STEPS[step] : undefined;

  // Focus the text box when a question expects typing (not on first open, so phones don't jump to the keyboard).
  useEffect(() => {
    if (open && current?.input && !typing && messages.length > 1) inputRef.current?.focus();
  }, [open, current, typing, messages.length]);

  // Escape closes; on phones the page behind stays still while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const root = document.documentElement;
    const previous = root.style.overflow;
    if (phone) root.style.overflow = 'hidden';
    if (!current?.input || messages.length <= 1) panelRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      root.style.overflow = previous;
    };
    // Only when opening or closing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phone, onClose]);

  const advance = (field: Field, value: string, shown: string) => {
    setHint('');
    setDraft('');
    say('you', shown);
    const nextAnswers = { ...answers, [field]: value };
    setAnswers(nextAnswers);
    const next = step + 1;
    if (next < STEPS.length) {
      setStep(next);
      genieSays(STEPS[next].ask);
    } else {
      genieSays('Here’s your ticket. Send it when you’re happy with it.', () => setPhase('review'));
    }
  };

  const answer = (value: string, shown = value) => {
    if (!current) return;
    const trimmed = value.trim().slice(0, current.max);
    if (!trimmed && current.optional) return advance(current.field, '', 'Skip');
    const problem = current.check(trimmed);
    if (problem) return setHint(problem);
    advance(current.field, trimmed, shown === value ? trimmed : shown);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (current?.input) answer(draft);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // In the long answer, Enter adds a line; Ctrl/⌘ + Enter sends.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      answer(draft);
    }
  };

  const restart = () => {
    setMessages([]);
    setAnswers({});
    setStep(0);
    setPhase('asking');
    setTicket(null);
    setHint('');
    setDraft('');
    startedAt.current = Date.now();
    genieSays(STEPS[0].ask);
  };

  const send = async () => {
    setPhase('sending');
    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: answers.name ?? '',
          contact: answers.contact ?? '',
          category: answers.category ?? 'Other',
          urgency: answers.urgency ?? 'This week',
          stack: answers.stack ?? '',
          title: answers.title ?? '',
          description: answers.description ?? '',
          link: answers.link ?? '',
          page: pathname,
          website: '',
          startedAt: startedAt.current,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ticket?: string; priority?: string; error?: string };
      if (res.ok && data.ticket) {
        setTicket({ id: data.ticket, priority: data.priority });
        setPhase('done');
        genieSays(`Done! Your ticket is on Madhukar’s phone. He’ll reply at ${answers.contact}.`);
      } else {
        setPhase('error');
        genieSays(data.error ?? 'Something went wrong on my side. Please try again.');
      }
    } catch {
      setPhase('error');
      genieSays('I couldn’t reach the server. Check your connection and try again.');
    }
  };

  // A post page offers its own title as a one-tap answer.
  const postTitle =
    current?.field === 'title' && pathname.startsWith('/blog/') && typeof document !== 'undefined'
      ? document.querySelector('article h1')?.textContent?.trim()
      : undefined;
  const chips = current?.chips ?? (postTitle ? [{ label: `About “${postTitle.slice(0, 60)}${postTitle.length > 60 ? '…' : ''}”`, value: `Help with: ${postTitle}` }] : []);

  const summary: [string, string | undefined][] = [
    ['Type', answers.category],
    ['Title', answers.title],
    ['Details', answers.description],
    ['Urgency', answers.urgency],
    ['Stack', answers.stack],
    ['Link', answers.link],
    ['From', answers.name && `${answers.name} · ${answers.contact}`],
  ];

  const sheetStyle = phone
    ? { bottom: keyboard.bottom, maxHeight: keyboard.height ? Math.min(keyboard.height - 12, 720) : undefined }
    : undefined;

  return (
    <>
      {/* Phones: dim the page behind the sheet; tapping it closes the chat. */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn('fixed inset-0 z-[159] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 sm:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
      />
      <div
        id="genie-chat"
        ref={panelRef}
        role="dialog"
        aria-modal={phone || undefined}
        aria-label="Genie: file a ticket"
        tabIndex={-1}
        style={sheetStyle}
        className={cn(
          // Closed, it is invisible as well as transparent, so it leaves the tab order and screen readers.
          'genie-panel glass glass-strong fixed z-[160] flex flex-col overflow-hidden outline-none transition-[transform,opacity,visibility] duration-300 ease-out',
          // Phones: a bottom sheet. Larger screens: a panel above the button.
          'inset-x-0 bottom-0 h-[min(88dvh,44rem)] rounded-b-none rounded-t-[1.75rem]',
          'sm:inset-x-auto sm:right-4 sm:h-[min(36rem,calc(100dvh-7rem))] sm:w-[23rem] sm:rounded-[1.5rem] lg:bottom-24 lg:right-6',
          'sm:bottom-[calc(max(1rem,env(safe-area-inset-bottom))+9rem)]',
          open ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-8 opacity-0 max-sm:translate-y-full'
        )}
      >
        {/* Grab handle, phones only. */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
          <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
        </div>

        <header className="flex items-center gap-3 border-b border-foreground/10 px-4 pb-3 pt-2 sm:pt-4">
          <Orb />
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">Genie</p>
            <p className="truncate text-xs text-muted-foreground">Tickets go straight to Madhukar</p>
          </div>
          {messages.length > 1 && phase !== 'sending' && (
            <button type="button" onClick={restart} className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:bg-foreground/10 hover:text-foreground" aria-label="Start over" title="Start over">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:bg-foreground/10 hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite" aria-relevant="additions">
          {messages.map((m) =>
            m.from === 'genie' ? (
              <div key={m.id} className="genie-in flex items-end gap-2">
                <Orb small />
                <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-foreground/[0.06] px-3.5 py-2.5 text-[0.95rem] leading-snug dark:bg-white/[0.08]">{m.text}</p>
              </div>
            ) : (
              <div key={m.id} className="genie-in flex justify-end">
                <p className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[0.95rem] leading-snug text-primary-foreground">{m.text}</p>
              </div>
            )
          )}

          {typing && (
            <div className="flex items-end gap-2" aria-label="Genie is typing">
              <Orb small />
              <span className="genie-typing flex gap-1 rounded-2xl rounded-bl-md bg-foreground/[0.06] px-3.5 py-3 dark:bg-white/[0.08]">
                <i /><i /><i />
              </span>
            </div>
          )}

          {(phase === 'review' || phase === 'sending' || phase === 'error') && !typing && (
            <div className="genie-in ml-9 space-y-3 rounded-2xl bg-foreground/[0.04] p-3.5 text-sm ring-1 ring-foreground/10 dark:bg-white/[0.05]">
              <dl className="space-y-1.5">
                {summary.filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className={cn('break-words', k === 'Details' && 'line-clamp-4 whitespace-pre-wrap')}>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={send} disabled={phase === 'sending'} className="tinted-button !px-4 !py-2">
                  {phase === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                  {phase === 'error' ? 'Try again' : 'Send ticket'}
                </button>
                {phase === 'error' && email && (
                  <a href={`mailto:${email}?subject=${encodeURIComponent(answers.title ?? 'Help with a bug')}&body=${encodeURIComponent(answers.description ?? '')}`} className="glass glass-pill glass-interactive inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium">
                    <Mail className="h-4 w-4" /> Email instead
                  </a>
                )}
              </div>
            </div>
          )}

          {phase === 'done' && ticket && !typing && (
            <div className="genie-in ml-9 space-y-3 rounded-2xl bg-foreground/[0.04] p-3.5 text-sm ring-1 ring-foreground/10 dark:bg-white/[0.05]">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(ticket.id);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-xl bg-background/60 px-3 py-2 font-mono text-base font-semibold tracking-wider"
                title="Copy ticket ID"
              >
                {ticket.id}
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
              {ticket.priority && <p className="text-muted-foreground">Triaged as <span className="font-semibold text-foreground">{ticket.priority}</span></p>}
              <button type="button" onClick={restart} className="font-medium text-primary hover:underline">
                File another ticket
              </button>
            </div>
          )}
        </div>

        {/* Answer area: chips for fixed choices, a text box for the rest. */}
        {current && !typing && (
          <form onSubmit={onSubmit} className="border-t border-foreground/10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            {hint && <p role="alert" className="mb-2 px-1 text-sm text-[hsl(var(--destructive))]">{hint}</p>}
            {(chips.length > 0 || current.optional) && (
              <div className={cn('flex flex-wrap gap-2', current.input && 'mb-2.5')}>
                {chips.map((c) => (
                  <button key={c.value} type="button" onClick={() => answer(c.value, c.label)} className="rounded-full bg-foreground/[0.06] px-3.5 py-2 text-sm font-medium ring-1 ring-foreground/10 transition active:scale-95 hover:bg-primary hover:text-primary-foreground dark:bg-white/[0.07]">
                    {c.label}
                  </button>
                ))}
                {current.optional && (
                  <button type="button" onClick={() => answer('')} className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground ring-1 ring-foreground/10 transition active:scale-95 hover:text-foreground">
                    Skip
                  </button>
                )}
              </div>
            )}
            {current.input && (
              <div className="flex items-end gap-2">
                {current.input === 'textarea' ? (
                  <textarea
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setHint('');
                    }}
                    onKeyDown={onKeyDown}
                    rows={3}
                    maxLength={current.max}
                    placeholder={current.placeholder}
                    aria-label={current.ask}
                    className="min-h-[5.5rem] flex-1 resize-none rounded-2xl bg-foreground/[0.05] px-3.5 py-2.5 text-base text-foreground outline-none ring-1 ring-foreground/10 placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary dark:bg-white/[0.06] sm:text-[0.95rem]"
                  />
                ) : (
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setHint('');
                    }}
                    type="text"
                    inputMode={current.input === 'email' ? 'email' : undefined}
                    autoComplete={current.field === 'name' ? 'name' : current.field === 'contact' ? 'email' : 'off'}
                    autoCapitalize={current.field === 'contact' || current.field === 'link' ? 'none' : undefined}
                    maxLength={current.max}
                    placeholder={current.placeholder}
                    aria-label={current.ask}
                    enterKeyHint="send"
                    className="h-11 flex-1 rounded-full bg-foreground/[0.05] px-4 text-base text-foreground outline-none ring-1 ring-foreground/10 placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary dark:bg-white/[0.06] sm:text-[0.95rem]"
                  />
                )}
                <button type="submit" aria-label="Send answer" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition active:scale-90 disabled:opacity-40" disabled={!draft.trim() && !current.optional}>
                  <SendHorizontal className="h-5 w-5" />
                </button>
              </div>
            )}
            {current.input === 'textarea' && <p className="mt-1.5 px-1 text-xs text-muted-foreground">{draft.trim().length}/20+ characters · Ctrl/⌘ + Enter to send</p>}
          </form>
        )}
      </div>
    </>
  );
}
