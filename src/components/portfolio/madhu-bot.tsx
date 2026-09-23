'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUp, Bot, ChevronDown, Loader2, Search, Sparkles, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

type TraceHit = {
  rank: number;
  title: string;
  href: string;
  kind: string;
  score: number;
  matched: string[];
  snippet: string;
};

type Trace = {
  terms: string[];
  unknown: string[];
  generic: string[];
  corpusSize: number;
  mode: 'llm' | 'extractive';
  model: string | null;
  hits: TraceHit[];
  prompt: { system: string; user: string } | null;
  retrievalMs: number;
};

type Done = { mode: 'llm' | 'extractive'; retrievalMs: number; firstTokenMs: number | null; generationMs: number; totalMs: number };

type Message =
  | { role: 'user'; text: string }
  | { role: 'bot'; text: string; trace?: Trace; done?: Done; fallback?: string; error?: string };

const SUGGESTIONS = [
  'Have you built production RAG systems?',
  'How does your hybrid search work?',
  'What did the chatbot latency audit find?',
  'Why Docker Swarm instead of Kubernetes?',
];

/** Renders "- bullets", **bold** and [n] citations. */
function AnswerText({ text, hits, onCite }: { text: string; hits: TraceHit[]; onCite: (rank: number) => void }) {
  const inline = (line: string, key: string): ReactNode[] =>
    line.split(/(\[\d+\]|\*\*[^*]+\*\*)/g).map((part, i) => {
      const cite = part.match(/^\[(\d+)\]$/);
      if (cite) {
        const rank = Number(cite[1]);
        const hit = hits.find((h) => h.rank === rank);
        return (
          <button
            key={`${key}-${i}`}
            type="button"
            onClick={() => onCite(rank)}
            title={hit?.title}
            className="mx-0.5 inline-flex h-4 min-w-4 -translate-y-0.5 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary hover:bg-primary/25"
          >
            {rank}
          </button>
        );
      }
      if (part.startsWith('**')) return <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong>;
      return <span key={`${key}-${i}`}>{part}</span>;
    });

  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (key: string) => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={key} className="my-2 space-y-1.5 pl-4">
        {bullets.map((b, i) => (
          <li key={i} className="list-disc marker:text-primary">{inline(b, `${key}-${i}`)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };
  lines.forEach((line, i) => {
    if (/^\s*[-*]\s+/.test(line)) bullets.push(line.replace(/^\s*[-*]\s+/, ''));
    else {
      flush(`ul-${i}`);
      if (line.trim()) blocks.push(<p key={`p-${i}`} className="my-1.5">{inline(line, `p-${i}`)}</p>);
    }
  });
  flush('ul-end');
  return <div className="text-[15px] leading-relaxed text-foreground/90">{blocks}</div>;
}

function TracePanel({ trace, done, highlight, idPrefix }: { trace: Trace; done?: Done; highlight: number | null; idPrefix: string }) {
  const max = Math.max(...trace.hits.map((h) => h.score), 1);
  return (
    <div className="space-y-4 text-sm">
      {/* Pipeline */}
      <ol className="flex flex-wrap items-center gap-1.5 text-xs">
        {[
          `Tokenise → ${trace.terms.length} terms`,
          `BM25 over ${trace.corpusSize} passages · ${trace.retrievalMs} ms`,
          `Top ${trace.hits.length}`,
          trace.mode === 'llm' ? `LLM: ${trace.model}` : 'Extractive (no LLM)',
          done ? `Total ${done.totalMs} ms${done.firstTokenMs != null ? ` · first token ${done.firstTokenMs} ms` : ''}` : '…',
        ].map((step, i, all) => (
          <li key={step} className="flex items-center gap-1.5">
            <span className="glass-inset rounded-full px-2.5 py-1 text-foreground/80">{step}</span>
            {i < all.length - 1 && <span className="text-muted-foreground">→</span>}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Query terms</span>
        {trace.terms.map((t) => (
          <span
            key={t}
            title={trace.generic.includes(t) ? 'Generic word: counts at 25% weight' : undefined}
            className={cn('chip', trace.unknown.includes(t) ? 'chip-orange line-through' : trace.generic.includes(t) ? 'opacity-50' : 'chip-accent')}
          >
            {t}
          </span>
        ))}
        {trace.unknown.length > 0 && <span className="text-xs text-muted-foreground">(struck through: not found anywhere)</span>}
      </div>

      <ul className="space-y-2">
        {trace.hits.map((h) => (
          <li
            key={h.rank}
            id={`${idPrefix}-hit-${h.rank}`}
            className={cn('glass-inset p-3 transition-shadow', highlight === h.rank && 'ring-2 ring-primary')}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                {h.rank}
              </span>
              <Link href={h.href} className="min-w-0 flex-1 truncate font-semibold text-foreground hover:text-primary">
                {h.title}
              </Link>
              <span className="shrink-0 tabular-nums text-xs text-muted-foreground">{h.score.toFixed(2)}</span>
            </div>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(h.score / max) * 100}%` }} />
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{h.snippet}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {h.matched.map((m) => (
                <span key={m} className="rounded-full bg-[hsl(var(--sys-green)/0.14)] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--sys-green))]">
                  {m}
                </span>
              ))}
              <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] text-muted-foreground">{h.kind}</span>
            </div>
          </li>
        ))}
      </ul>

      {trace.prompt && (
        <details className="glass-inset p-3">
          <summary className="cursor-pointer text-xs font-semibold text-foreground/80">Exact prompt sent to the model</summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
            {`SYSTEM:\n${trace.prompt.system}\n\nUSER:\n${trace.prompt.user}`}
          </pre>
        </details>
      )}
    </div>
  );
}

function BotMessage({ message, pending }: { message: Extract<Message, { role: 'bot' }>; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const idPrefix = `msg${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const cited = message.trace
    ? message.trace.hits.filter((h) => new RegExp(`\\[${h.rank}\\]`).test(message.text))
    : [];

  const cite = (rank: number) => {
    setOpen(true);
    setHighlight(rank);
    setTimeout(() => document.getElementById(`${idPrefix}-hit-${rank}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
  };

  return (
    <div className="flex gap-3">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
        <Bot className="h-4 w-4" />
      </span>
      <div className="glass min-w-0 flex-1 p-4" style={{ ['--glass-radius' as string]: '1.25rem' }}>
        {message.error ? (
          <p className="text-sm text-destructive">{message.error}</p>
        ) : message.text ? (
          <AnswerText text={message.text} hits={message.trace?.hits ?? []} onCite={cite} />
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {message.trace ? 'Writing…' : 'Searching…'}
          </p>
        )}

        {cited.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cited.map((h) => (
              <Link key={h.rank} href={h.href} className="chip hover:!bg-primary/15">
                <span className="font-bold text-primary">{h.rank}</span>
                <span className="max-w-[16rem] truncate">{h.title}</span>
              </Link>
            ))}
          </div>
        )}

        {message.trace && (
          <div className="mt-3 border-t border-foreground/10 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('chip', message.trace.mode === 'llm' ? 'chip-purple' : 'chip-teal')}>
                {message.trace.mode === 'llm' ? <Sparkles className="h-3 w-3" /> : <Quote className="h-3 w-3" />}
                {message.done?.mode === 'extractive' || message.trace.mode === 'extractive'
                  ? 'Quoted from sources'
                  : `Written by ${message.trace.model}`}
              </span>
              {message.fallback && <span className="text-xs text-muted-foreground">LLM unavailable, fell back to quoting</span>}
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <Search className="h-3.5 w-3.5" /> How I found this
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
              </button>
            </div>
            {open && (
              <div className="mt-3">
                <TracePanel trace={message.trace} done={pending ? undefined : message.done} highlight={highlight} idPrefix={idPrefix} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function MadhuBot({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages]);

  const updateBot = (patch: (m: Extract<Message, { role: 'bot' }>) => Extract<Message, { role: 'bot' }>) =>
    setMessages((all) => {
      const next = [...all];
      const last = next[next.length - 1];
      if (last?.role === 'bot') next[next.length - 1] = patch(last);
      return next;
    });

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'bot', text: '' }]);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        updateBot((m) => ({ ...m, error: err.error ?? `Request failed (${res.status})` }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === 'trace') updateBot((m) => ({ ...m, trace: event }));
          else if (event.type === 'token') updateBot((m) => ({ ...m, text: m.text + event.text }));
          else if (event.type === 'fallback') updateBot((m) => ({ ...m, text: '', fallback: event.reason }));
          else if (event.type === 'done') updateBot((m) => ({ ...m, done: event }));
        }
      }
    } catch (err) {
      updateBot((m) => ({ ...m, error: `Something went wrong: ${String(err)}` }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('flex flex-col', compact ? 'h-full' : 'min-h-[60vh]')}>
      <div className={cn('flex-1 space-y-4', compact && 'overflow-y-auto p-4')}>
        {messages.length === 0 && (
          <div className="glass p-5 md:p-6">
            <p className="text-base font-semibold text-foreground">Ask me anything about my work.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              I answer only from my blog, projects and experience, and I show my working: every answer lists the
              passages I retrieved and why.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => ask(s)} className="chip hover:!bg-primary/15">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-primary px-4 py-2.5 text-[15px] text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                {m.text}
              </p>
            </div>
          ) : (
            <BotMessage key={i} message={m} pending={busy && i === messages.length - 1} />
          )
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className={cn('glass glass-strong glass-pill mt-4 flex items-center gap-2 p-1.5 pl-5', compact ? 'm-3 mt-0' : 'sticky bottom-28 lg:bottom-6')}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={400}
          placeholder="Ask about my projects, stack or posts…"
          aria-label="Ask Madhu-bot"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="tinted-button !h-10 !w-10 !p-0 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
