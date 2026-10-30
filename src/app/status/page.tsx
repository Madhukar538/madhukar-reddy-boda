import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { AutoRefresh } from '@/components/portfolio/auto-refresh';
import { probeApi, uptimeMonitors, type Beat, type Monitor } from '@/lib/status';

export const metadata: Metadata = {
  title: 'System status — Boda Madhukar Reddy',
  description: 'Live status of this site: Cloudflare, the Next.js front end, the .NET API and MongoDB Atlas, with response times, uptime and the last deploys.',
  alternates: { canonical: '/status' },
};

// Checked live on every request (the page refreshes itself every 30 s while open).
export const dynamic = 'force-dynamic';

type Node = { name: string; role: string; state: 'up' | 'down' | 'unknown'; detail: string };

const short = (sha?: string) => (sha && /^[0-9a-f]{7,}$/i.test(sha) ? sha.slice(0, 7) : undefined);

function Uptime({ monitor }: { monitor: Monitor }) {
  const upMs = monitor.beats.filter((b) => b.status === 'up' && b.ms !== undefined).map((b) => b.ms!);
  const avg = upMs.length ? Math.round(upMs.reduce((a, b) => a + b, 0) / upMs.length) : undefined;
  return (
    <li className="border-b border-foreground/10 py-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-medium text-foreground">{monitor.name}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {monitor.uptime24 !== undefined && <span className="text-foreground">{(monitor.uptime24 * 100).toFixed(2)}%</span>} 24 h
          {avg !== undefined && <> · avg {avg} ms</>}
        </span>
      </div>
      <div className="status-beats mt-2.5" aria-label={`Last ${monitor.beats.length} checks`}>
        {monitor.beats.map((b: Beat) => (
          <span key={b.time} data-status={b.status} title={`${b.time} · ${b.status}${b.ms !== undefined ? ` · ${b.ms} ms` : ''}`} />
        ))}
      </div>
    </li>
  );
}

export default async function StatusPage() {
  const [api, monitors] = await Promise.all([probeApi(), uptimeMonitors()]);
  const siteSha = short(process.env.NEXT_PUBLIC_BUILD_ID);
  const builtAt = process.env.NEXT_PUBLIC_BUILD_TIME;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const checkedAt = fmt(new Date().toISOString());

  // The path a request takes, left to right. Without an API configured (local), only the site is known.
  const nodes: Node[] = [
    { name: 'visitor', role: 'you', state: 'up', detail: 'browser' },
    {
      name: 'cloudflare',
      role: 'edge + tunnel',
      state: api?.edge ? 'up' : api?.ok === false ? 'down' : 'unknown',
      detail: api?.edge ? `edge ${api.edge}` : 'not seen',
    },
    { name: 'next.js', role: 'this site', state: 'up', detail: siteSha ? `build ${siteSha}` : 'local build' },
    {
      name: '.net api',
      role: 'api.dhucar.in',
      state: api ? (api.ok ? 'up' : 'down') : 'unknown',
      detail: api ? (api.ok ? `${api.ms} ms` : 'not responding') : 'not configured',
    },
    {
      name: 'mongodb',
      role: 'atlas',
      state: api?.db === 'ok' ? 'up' : api?.db === 'down' ? 'down' : 'unknown',
      detail: api?.db === 'ok' ? `${api.dbMs} ms` : api?.db === 'down' ? 'not responding' : 'unknown',
    },
  ];
  const down = nodes.filter((n) => n.state === 'down');
  const monitorsDown = (monitors ?? []).filter((m) => m.beats.at(-1)?.status === 'down');
  const unknown = nodes.filter((n) => n.state === 'unknown');
  const headline =
    down.length + monitorsDown.length >= 2
      ? 'Partial outage.'
      : down.length + monitorsDown.length === 1
        ? 'One part is degraded.'
        : unknown.length > 0
          ? "Some parts can't be checked right now."
          : 'All systems operational.';

  return (
    <div className="container mx-auto max-w-4xl px-4 md:px-6 pt-10 lg:pt-36 pb-16 lg:pb-24">
      <AutoRefresh seconds={30} />
      <p className="font-mono text-xs text-primary">status · live</p>
      <h1 className="mt-3 text-[clamp(2.5rem,7vw,4rem)] leading-[1.02] text-foreground">{headline}</h1>
      <p className="mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
        This site is a small production system, and this page checks it live: the path your request just took, how long each hop
        answered in, and when each part was last deployed.
      </p>

      <section aria-labelledby="path-heading" className="mt-12">
        <p id="path-heading" className="mb-4 font-mono text-xs text-muted-foreground">request path</p>
        <ol className="status-path">
          {nodes.map((n, i) => (
            <li key={n.name} className="status-node" data-state={n.state} style={{ '--i': i } as CSSProperties}>
              <span className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{n.name}</span>
                <span aria-hidden className="status-dot" />
              </span>
              <span className="text-muted-foreground">{n.role}</span>
              <span className="status-detail">{n.detail}</span>
              <span className="sr-only">{n.state === 'up' ? 'operational' : n.state === 'down' ? 'down' : 'unknown'}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-mono text-[0.7rem] text-muted-foreground">checked from the site&apos;s server at {checkedAt} IST · refreshes every 30 s</p>
      </section>

      {monitors && monitors.length > 0 && (
        <section aria-labelledby="uptime-heading" className="mt-14">
          <h2 id="uptime-heading" className="text-2xl md:text-3xl text-foreground">Uptime</h2>
          <p className="mt-1 text-sm text-muted-foreground">From Uptime Kuma, checking every minute. Each bar is one check, newest on the right.</p>
          <ul className="mt-4 border-t border-foreground/10">
            {monitors.map((m) => (
              <Uptime key={m.id} monitor={m} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="deploys-heading" className="mt-14">
        <h2 id="deploys-heading" className="text-2xl md:text-3xl text-foreground">Last deploys</h2>
        <dl className="mt-4 grid grid-cols-[7rem_1fr] gap-y-2.5 border-t border-foreground/10 pt-4 font-mono text-sm">
          <dt className="text-muted-foreground">site</dt>
          <dd className="text-foreground/85">
            {siteSha ?? 'local'}
            {builtAt && <span className="text-muted-foreground"> · built {fmt(builtAt)} IST</span>}
          </dd>
          <dt className="text-muted-foreground">api</dt>
          <dd className="text-foreground/85">
            {api?.version ? `v${api.version}` : 'unknown'}
            {api?.commit && <span className="text-muted-foreground"> · {short(api.commit) ?? api.commit}</span>}
          </dd>
          <dt className="text-muted-foreground">stack</dt>
          <dd className="text-foreground/85">Next.js 16 · .NET 8 · MongoDB Atlas · Cloudflare Tunnel · Coolify</dd>
        </dl>
      </section>
    </div>
  );
}
