import { bugReportSchema, ticketId, triage, type BugReport, type Priority, type TraceStep } from '@/lib/bug-triage';
import { escapeHtml, missingTelegramVars, sendTelegramMessage, telegramConfigured } from '@/lib/telegram';
import { newStatusToken, saveTicket, statusPath, ticketStoreConfigured } from '@/lib/tickets';

// "Hire me for a bug": validates a report, triages it into a ticket, stores it
// in the API (managed under /admin/tickets) and pings Telegram.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Best-effort, per-instance rate limits. Only delivered reports count, so failed attempts (e.g. while
// Telegram isn't configured yet) don't lock a visitor out.
// - Per visitor: 3 reports per 10 minutes.
// - Site-wide: 20 per 10 minutes, so no trick with addresses can flood the phone with pings.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 3;
const SITE_LIMIT = 20;
const MAX_TRACKED = 5000;
const hits = new Map<string, number[]>();
let siteHits: number[] = [];

const fresh = (times: number[]) => times.filter((t) => Date.now() - t < WINDOW_MS);
const recentHits = (ip: string) => fresh(hits.get(ip) ?? []);

function rateLimited(ip: string) {
  siteHits = fresh(siteHits);
  return siteHits.length >= SITE_LIMIT || recentHits(ip).length >= LIMIT;
}

function recordReport(ip: string) {
  // Drop visitors whose window has passed; if still full, the oldest go first. Never clear the
  // whole map: that would hand everyone a fresh allowance.
  if (hits.size >= MAX_TRACKED) {
    for (const [key, times] of hits) if (fresh(times).length === 0) hits.delete(key);
    for (const key of hits.keys()) {
      if (hits.size < MAX_TRACKED) break;
      hits.delete(key);
    }
  }
  hits.set(ip, [...recentHits(ip), Date.now()]);
  siteHits.push(Date.now());
}

/**
 * The visitor's IP as Cloudflare saw it. The site is only reachable through Cloudflare, which sets
 * CF-Connecting-IP itself; X-Forwarded-For and X-Real-IP are not used, because a client can write
 * them. Without Cloudflare's header every visitor shares one allowance (and the site-wide cap holds).
 */
function clientIp(request: Request) {
  return request.headers.get('cf-connecting-ip')?.trim() || 'unknown';
}

const PRIORITY_ICON: Record<Priority, string> = { P1: '🔴', P2: '🟠', P3: '🟡', P4: '🟢' };

function formatTicket(id: string, report: BugReport, priority: Priority, reasons: string[]) {
  const e = escapeHtml;
  const lines = [
    `${PRIORITY_ICON[priority]} <b>${priority} · New ${e(report.category.toLowerCase())} ticket</b>`,
    `<code>${id}</code>`,
    '',
    `<b>${e(report.title)}</b>`,
    '',
    e(report.description),
    '',
    `<b>From:</b> ${e(report.name)} (${e(report.contact)})`,
    `<b>Urgency:</b> ${e(report.urgency)}`,
  ];
  if (report.stack) lines.push(`<b>Stack:</b> ${e(report.stack)}`);
  if (report.link) lines.push(`<b>Link:</b> ${e(report.link)}`);
  if (report.page) lines.push(`<b>Filed from:</b> ${e(report.page)} (genie)`);
  lines.push(`<b>Triage:</b> ${e(reasons.join(', '))}`);
  if (ticketStoreConfigured()) lines.push(`<b>Manage:</b> https://dhucar.in/admin/tickets/${id}`);
  // Telegram caps messages at 4096 characters.
  const text = lines.join('\n');
  return text.length > 4000 ? `${text.slice(0, 3990)}…` : text;
}

/** Setup check: open /api/bug-report to see whether Telegram and ticket storage are configured (names only, no values). */
export function GET() {
  const missing: string[] = [...missingTelegramVars()];
  if (!ticketStoreConfigured()) missing.push('API_URL', 'REVALIDATE_SECRET (32+ characters)');
  return Response.json(
    missing.length
      ? { configured: false, missing, hint: 'Add these in the server environment, then redeploy or restart the app.' }
      : { configured: true }
  );
}

// A report is a few KB of text; anything far bigger is abuse, refused before parsing.
const MAX_BODY_BYTES = 32 * 1024;

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return Response.json({ error: 'Report is too large' }, { status: 413 });
  }
  let body: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text) > MAX_BODY_BYTES) return Response.json({ error: 'Report is too large' }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = bugReportSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message]));
    return Response.json({ error: 'Please check the highlighted fields', fields }, { status: 422 });
  }
  const report = parsed.data;

  // Bots: pretend it worked so they don't retry.
  const tooFast = report.startedAt !== undefined && Date.now() - report.startedAt < 3000;
  if (report.website || tooFast) return Response.json({ ok: true, ticket: ticketId() });

  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return Response.json({ error: 'Too many reports from you just now. Try again in a few minutes.' }, { status: 429 });
  }

  const canStore = ticketStoreConfigured();
  const canPing = telegramConfigured();
  if (!canStore && !canPing) {
    return Response.json({ error: 'Bug reports are offline right now. Please email me instead.' }, { status: 503 });
  }

  const id = ticketId();
  const statusToken = newStatusToken();
  const { priority, reasons } = triage(report);
  // Each delivery's own duration, for the trace the form shows afterwards.
  const timed = async (work: () => Promise<unknown>) => {
    const start = performance.now();
    await work();
    return Math.round(performance.now() - start);
  };
  // Stored and pinged in parallel; the report counts as received if either works.
  const [stored, pinged] = await Promise.allSettled([
    canStore ? timed(() => saveTicket(id, report, priority, reasons, statusToken)) : Promise.reject(new Error('Ticket store not configured')),
    canPing ? timed(() => sendTelegramMessage(formatTicket(id, report, priority, reasons))) : Promise.reject(new Error('Telegram not configured')),
  ]);
  if (stored.status === 'rejected' && canStore) console.error('[bug-report] store', stored.reason);
  if (pinged.status === 'rejected' && canPing) console.error('[bug-report] telegram', pinged.reason);
  if (stored.status === 'rejected' && pinged.status === 'rejected') {
    return Response.json({ error: "Couldn't deliver your report. Please try again or email me." }, { status: 502 });
  }
  recordReport(ip);
  // What actually happened, step by step (the form draws it as a request trace).
  const trace: TraceStep[] = [
    { step: 'validate', ok: true },
    { step: 'triage', ok: true, detail: priority },
    { step: 'store', ok: stored.status === 'fulfilled', ms: stored.status === 'fulfilled' ? stored.value : undefined },
    { step: 'notify', ok: pinged.status === 'fulfilled', ms: pinged.status === 'fulfilled' ? pinged.value : undefined },
  ];
  // The status link only works if the ticket (and so the secret's hash) was stored.
  const statusUrl = stored.status === 'fulfilled' ? statusPath(id, statusToken) : undefined;
  return Response.json({ ok: true, ticket: id, priority, trace, statusUrl });
}
