import { Gauge } from 'lucide-react';
import type { Benchmark } from '@/data/benchmarks';

const fmt = (n: number) => n.toLocaleString('en-US');

/** Bar charts for a post's benchmark: one measure per chart, values labelled on the bars. */
export function BenchmarkCharts({ benchmark }: { benchmark: Benchmark }) {
  return (
    <figure className="glass mb-8 p-5 md:p-7">
      <figcaption className="mb-6">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Gauge aria-hidden className="h-4 w-4 text-primary" /> Benchmark
        </span>
        <span className="mt-1 block text-xl font-bold tracking-tight text-foreground">{benchmark.title}</span>
        <span className="block text-sm text-muted-foreground">{benchmark.subtitle}</span>
      </figcaption>

      <div className="grid gap-7 md:grid-cols-3 md:gap-6">
        {benchmark.charts.map((chart) => {
          const max = Math.max(...chart.bars.map((b) => b.value));
          const best = chart.better === 'lower' ? Math.min(...chart.bars.map((b) => b.value)) : max;
          return (
            <section key={chart.title} aria-label={chart.title}>
              <p className="text-[15px] font-semibold text-foreground">{chart.title}</p>
              <p className="mb-3 text-xs text-muted-foreground">
                {chart.caption} · {chart.better === 'lower' ? 'lower is better' : 'higher is better'}
              </p>
              <ul className="space-y-3">
                {chart.bars.map((bar) => (
                  <li key={bar.label} title={`${bar.label}: ${bar.display}`}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-foreground">{bar.label}</span>
                      <span className="tabular-nums font-semibold text-foreground">{bar.display}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-foreground/10">
                      <div
                        className={`cs-bar h-full rounded-full ${bar.value === best ? 'bg-primary' : 'bg-primary/45'}`}
                        style={{ width: `${Math.max(3, (bar.value / max) * 100)}%` }}
                      />
                    </div>
                    {bar.note && <p className="mt-1 text-xs text-muted-foreground">{bar.note}</p>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* The same numbers as a table, for screen readers and copy-paste. */}
      <table className="sr-only">
        <caption>{benchmark.title}</caption>
        <thead>
          <tr><th>Measure</th>{benchmark.charts[0].bars.map((b) => <th key={b.label}>{b.label}</th>)}</tr>
        </thead>
        <tbody>
          {benchmark.charts.map((c) => (
            <tr key={c.title}><th>{c.title}</th>{c.bars.map((b) => <td key={b.label}>{b.display ?? fmt(b.value)}</td>)}</tr>
          ))}
        </tbody>
      </table>

      {benchmark.footnote && <p className="mt-6 text-xs text-muted-foreground">{benchmark.footnote}</p>}
    </figure>
  );
}
