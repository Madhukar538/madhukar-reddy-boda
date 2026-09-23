import { bugReportSchema, ticketId, triage, type BugReport, type Priority } from '@/lib/bug-triage';
import { escapeHtml, sendTelegramMessage, telegramConfigured } from '@/lib/telegram';

// "Hire me for a bug": validates a report, triages it into a ticket and
// sends it to Telegram.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Best-effort, per-instance rate limit: 3 reports per IP per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 3;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
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
  lines.push(`<b>Triage:</b> ${e(reasons.join(', '))}`);
  // Telegram caps messages at 4096 characters.
  const text = lines.join('\n');
  return text.length > 4000 ? `${text.slice(0, 3990)}…` : text;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
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

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
  if (rateLimited(ip)) {
    return Response.json({ error: 'Too many reports from you just now. Try again in a few minutes.' }, { status: 429 });
  }

  if (!telegramConfigured()) {
    return Response.json({ error: 'Bug reports are offline right now. Please email me instead.' }, { status: 503 });
  }

  const id = ticketId();
  const { priority, reasons } = triage(report);
  try {
    await sendTelegramMessage(formatTicket(id, report, priority, reasons));
  } catch (error) {
    console.error('[bug-report]', error);
    return Response.json({ error: "Couldn't deliver your report. Please try again or email me." }, { status: 502 });
  }
  return Response.json({ ok: true, ticket: id, priority });
}
