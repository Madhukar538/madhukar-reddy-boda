/**
 * Live checks for the /status page, made from the site's server:
 * - the API's /health (round trip, release, and its own MongoDB ping), reached
 *   through Cloudflare, whose cf-ray header names the edge that answered;
 * - Uptime Kuma's public status page, when UPTIME_KUMA_URL and UPTIME_KUMA_SLUG
 *   are set: each monitor's 24-hour uptime and recent heartbeats.
 * Every call has a short timeout and a failure becomes "down", never an error page.
 */

export type ApiProbe = {
  ok: boolean;
  ms?: number;
  version?: string;
  commit?: string;
  db?: 'ok' | 'down';
  dbMs?: number;
  /** Cloudflare data centre code (e.g. BOM), from the cf-ray header. */
  edge?: string;
};

export type Beat = { status: 'up' | 'down' | 'pending' | 'maintenance'; time: string; ms?: number };

export type Monitor = { id: number; name: string; uptime24?: number; beats: Beat[] };

const TIMEOUT_MS = 2500;

export async function probeApi(): Promise<ApiProbe | null> {
  const base = (process.env.API_URL || '').replace(/\/$/, '');
  if (!base) return null;
  const start = performance.now();
  try {
    const res = await fetch(`${base}/health`, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    const ms = Math.round(performance.now() - start);
    const ray = res.headers.get('cf-ray');
    const edge = ray?.split('-')[1];
    if (!res.ok) return { ok: false, ms, edge };
    const data = (await res.json()) as { version?: string; commit?: string; db?: string; dbMs?: number };
    return {
      ok: true,
      ms,
      version: data.version,
      commit: data.commit || undefined,
      db: data.db === 'ok' ? 'ok' : data.db ? 'down' : undefined,
      dbMs: data.dbMs ?? undefined,
      edge,
    };
  } catch {
    return { ok: false };
  }
}

const BEAT_STATUS: Record<number, Beat['status']> = { 0: 'down', 1: 'up', 2: 'pending', 3: 'maintenance' };

type KumaPage = { publicGroupList?: { monitorList?: { id: number; name: string }[] }[] };
type KumaBeats = {
  heartbeatList?: Record<string, { status: number; time: string; ping?: number | null }[]>;
  uptimeList?: Record<string, number>;
};

/** Uptime Kuma's public status page (no login): monitors, 24 h uptime and the last 60 heartbeats each. */
export async function uptimeMonitors(): Promise<Monitor[] | null> {
  const base = (process.env.UPTIME_KUMA_URL || '').replace(/\/$/, '');
  const slug = process.env.UPTIME_KUMA_SLUG || '';
  if (!base || !slug) return null;
  try {
    const opts = { next: { revalidate: 60 }, signal: AbortSignal.timeout(TIMEOUT_MS) };
    const [pageRes, beatsRes] = await Promise.all([
      fetch(`${base}/api/status-page/${encodeURIComponent(slug)}`, opts),
      fetch(`${base}/api/status-page/heartbeat/${encodeURIComponent(slug)}`, opts),
    ]);
    if (!pageRes.ok || !beatsRes.ok) return null;
    const page = (await pageRes.json()) as KumaPage;
    const beats = (await beatsRes.json()) as KumaBeats;
    return (page.publicGroupList ?? []).flatMap((g) => g.monitorList ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      uptime24: beats.uptimeList?.[`${m.id}_24`],
      beats: (beats.heartbeatList?.[String(m.id)] ?? []).slice(-60).map((b) => ({
        status: BEAT_STATUS[b.status] ?? 'pending',
        time: b.time,
        ms: b.ping ?? undefined,
      })),
    }));
  } catch {
    return null;
  }
}
