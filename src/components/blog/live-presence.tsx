'use client';

import { useEffect, useRef, useState } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import { Users } from 'lucide-react';
import { REACTED_EVENT, REACTIONS, presenceUrl } from '@/lib/engagement';

/**
 * Live presence on a post: how many people are reading it right now, a dot on the
 * reading-progress bar for each of them, and reactions that float up as anyone adds one.
 *
 * Talks to the API's SignalR hub over a WebSocket. The client library loads only after
 * the page is idle, and a tab in the background stops being counted. Nothing identifies
 * a reader: the server only ever sends a count and a list of scroll positions.
 */

type Snapshot = { count: number; positions: number[] };
type Float = { id: number; emoji: string; x: number };

const EMOJI = Object.fromEntries(REACTIONS.map((r) => [r.key, r.emoji])) as Record<string, string>;

/** How far through the article this reader is, 0-100 (the same measure as the progress bar). */
function readingPosition() {
  const body = document.querySelector<HTMLElement>('.article-body');
  if (!body) return 0;
  const rect = body.getBoundingClientRect();
  return Math.round(Math.min(1, Math.max(0, (window.innerHeight - rect.top) / Math.max(rect.height, 1))) * 100);
}

export function LivePresence({ slug }: { slug: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [mine, setMine] = useState(0);
  const nextId = useRef(0);

  useEffect(() => {
    if (!presenceUrl) return;
    const quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let connection: HubConnection | null = null;
    let cancelled = false;
    let lastSent = -1;
    let scrollTimer = 0;

    const float = (key: string) => {
      const emoji = EMOJI[key];
      if (!emoji || quiet) return;
      const id = ++nextId.current;
      setFloats((list) => [...list.slice(-11), { id, emoji, x: Math.round(Math.random() * 48) }]);
      window.setTimeout(() => setFloats((list) => list.filter((f) => f.id !== id)), 2800);
    };

    const sendPosition = () => {
      const position = readingPosition();
      setMine(position);
      if (connection?.state !== 'Connected' || Math.abs(position - lastSent) < 2) return;
      lastSent = position;
      connection.invoke('Move', position).catch(() => {});
    };

    const join = () => {
      if (connection?.state !== 'Connected' || document.visibilityState !== 'visible') return;
      lastSent = -1;
      connection.invoke('Join', slug).then(sendPosition, () => {});
    };

    const onScroll = () => {
      if (!scrollTimer) scrollTimer = window.setTimeout(() => ((scrollTimer = 0), sendPosition()), 400);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') return join();
      setSnapshot(null);
      if (connection?.state === 'Connected') connection.invoke('Leave').catch(() => {});
    };
    const onReacted = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      float(key);
      if (connection?.state === 'Connected') connection.invoke('React', key).catch(() => {});
    };

    const start = async () => {
      const signalR = await import('@microsoft/signalr');
      if (cancelled) return;
      connection = new signalR.HubConnectionBuilder()
        // Straight to a WebSocket: no negotiate request, no cookies.
        .withUrl(presenceUrl, { skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets })
        .withAutomaticReconnect([0, 2000, 5000, 15000, 30000])
        .configureLogging(signalR.LogLevel.None)
        .build();
      connection.on('presence', (s: Snapshot) => setSnapshot(s));
      connection.on('reaction', (key: string) => float(key));
      connection.onreconnected(join);
      connection.onclose(() => setSnapshot(null));
      try {
        await connection.start();
      } catch {
        return;
      }
      if (cancelled) return void connection.stop();
      join();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(REACTED_EVENT, onReacted);
    // Connect once the page has settled, so it never competes with loading the post.
    // (Safari has no requestIdleCallback: a short delay instead.)
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const idle = hasIdle ? window.requestIdleCallback(() => void start(), { timeout: 3000 }) : window.setTimeout(() => void start(), 1500);

    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.clearTimeout(scrollTimer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(REACTED_EVENT, onReacted);
      void connection?.stop();
    };
  }, [slug]);

  // Everyone else's dot: drop the one that is this reader (the nearest to where they are).
  const others = [...(snapshot?.positions ?? [])];
  if (others.length) {
    let nearest = 0;
    others.forEach((p, i) => {
      if (Math.abs(p - mine) < Math.abs(others[nearest] - mine)) nearest = i;
    });
    others.splice(nearest, 1);
  }
  const count = snapshot?.count ?? 0;

  return (
    <>
      {count >= 2 && (
        <>
          <div aria-hidden className="presence-dots">
            {others.map((p, i) => (
              <span key={i} style={{ left: `${p}%` }} />
            ))}
          </div>
          <p className="presence-badge glass glass-strong glass-pill" role="status">
            <span className="presence-pulse" aria-hidden />
            <Users aria-hidden className="h-3.5 w-3.5 lg:hidden" />
            <span aria-hidden className="lg:hidden">{count}</span>
            <span className="sr-only lg:not-sr-only">{count} people reading now</span>
          </p>
        </>
      )}
      {floats.length > 0 && (
        <div aria-hidden className="presence-floats">
          {floats.map((f) => (
            <span key={f.id} style={{ right: `${f.x}px` }}>
              {f.emoji}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
