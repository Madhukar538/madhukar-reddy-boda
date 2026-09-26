'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { CountItem, TrafficSummary } from '@/lib/admin/types';

/**
 * Daily page views as thin bars in the accent colour: one series, so no
 * legend (the panel title names it). Each bar has a hover/focus tooltip with
 * the day's views and visitors; the arrow keys move between days, and a
 * table view below carries every value without hovering.
 */

const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 40 };

// The smallest round tick step (1, 2 or 5 × 10ⁿ) whose four ticks cover the peak.
const niceMax = (value: number) => {
  if (value <= 4) return 4;
  const base = 10 ** Math.floor(Math.log10(value / 4));
  const step = [1, 2, 5, 10].map((m) => m * base).find((n) => n * 4 >= value) ?? base * 10;
  return step * 4;
};

const dayLabel = (day: string, long = false) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(long ? { weekday: 'short' } : {}), timeZone: 'UTC' });

// Fill the gaps so days with no views still get a slot.
function everyDay(summary: TrafficSummary) {
  const byDay = new Map(summary.daily.map((d) => [d.day, d]));
  const days: TrafficSummary['daily'] = [];
  const today = new Date();
  for (let i = summary.days - 1; i >= 0; i--) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i)).toISOString().slice(0, 10);
    days.push(byDay.get(day) ?? { day, pageViews: 0, visitors: 0 });
  }
  return days;
}

export function TrafficChart({ summary }: { summary: TrafficSummary }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.floor(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const days = everyDay(summary);
  const max = niceMax(Math.max(...days.map((d) => d.pageViews), 0));
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / days.length;
  const barW = Math.max(1, slot - 2); // 2px surface gap between bars
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const labelEvery = Math.ceil(days.length / Math.max(2, Math.floor(plotW / 70)));

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setActive((i) => {
      const current = i ?? days.length;
      return Math.min(days.length - 1, Math.max(0, current + (e.key === 'ArrowLeft' ? -1 : 1)));
    });
  };

  const current = active !== null ? days[active] : null;
  const tipLeft = active !== null ? Math.min(Math.max(PAD.left + slot * active + slot / 2, 70), width - 70) : 0;

  return (
    <div ref={wrapRef} className="relative">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Daily page views for the last ${summary.days} days. Use the left and right arrow keys to read each day.`}
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="hsl(var(--foreground) / 0.08)" />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
              {t.toLocaleString('en-IN')}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = PAD.left + slot * i + 1;
          const h = barHeight(d.pageViews, y, PAD.top + plotH);
          const r = Math.min(4, barW / 2, h);
          const top = PAD.top + plotH - h;
          return (
            <g key={d.day} onPointerEnter={() => setActive(i)}>
              {/* Hit area: the whole slot, taller than the bar. */}
              <rect x={x - 1} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
                  fill="hsl(var(--primary))"
                  opacity={active === null || active === i ? 1 : 0.45}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {dayLabel(d.day)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={PAD.left} x2={width - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="hsl(var(--foreground) / 0.2)" />
      </svg>

      {current && (
        <div
          className="glass glass-strong pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl px-3 py-2 whitespace-nowrap text-xs shadow-lg"
          style={{ left: tipLeft }}
          role="status"
        >
          <p className="mb-1 text-muted-foreground">{dayLabel(current.day, true)}</p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-3 rounded bg-primary" />
            <strong className="text-sm tabular-nums text-foreground">{current.pageViews.toLocaleString('en-IN')}</strong>
            <span className="text-muted-foreground">page views</span>
          </p>
          <p className="mt-0.5 pl-5 text-muted-foreground">
            <span className="tabular-nums text-foreground">{current.visitors.toLocaleString('en-IN')}</span> visitors
          </p>
        </div>
      )}

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show as a table</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-left tabular-nums">
            <thead className="text-xs text-muted-foreground">
              <tr><th className="py-1 font-medium">Day</th><th className="py-1 text-right font-medium">Page views</th><th className="py-1 text-right font-medium">Visitors</th></tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.day} className="border-t border-foreground/5">
                  <td className="py-1">{dayLabel(d.day, true)}</td>
                  <td className="py-1 text-right">{d.pageViews.toLocaleString('en-IN')}</td>
                  <td className="py-1 text-right">{d.visitors.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

// Bar height in px; a non-zero value always shows at least 2px.
function barHeight(value: number, y: (v: number) => number, baseline: number) {
  if (value <= 0) return 0;
  return Math.max(2, baseline - y(value));
}

/** A ranked list with a proportional bar behind each row; values stay in text ink. */
export function RankedList({ items, empty = 'Nothing yet.' }: { items: CountItem[]; empty?: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const top = Math.max(...items.map((i) => i.count));
  return (
    <ol className="space-y-1">
      {items.map((item) => (
        <li key={item.key} className="relative overflow-hidden rounded-lg px-2.5 py-1.5 text-sm">
          <span aria-hidden className="absolute inset-y-0 left-0 rounded-lg bg-primary/15" style={{ width: `${(item.count / top) * 100}%` }} />
          <span className="relative flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate" title={item.key}>{item.key || '(none)'}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{item.count.toLocaleString('en-IN')}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
