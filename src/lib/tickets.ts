import { createHmac } from 'node:crypto';
import type { BugReport, Priority } from '@/lib/bug-triage';

/**
 * Saves a triaged ticket in the API (server-to-server). The request is signed
 * like the API's calls to this site: X-Signature = sha256=HMAC(REVALIDATE_SECRET,
 * "{X-Timestamp}.{body}"), so only this server can file tickets.
 */

const apiBase = () => (process.env.API_URL || '').replace(/\/$/, '');
const secret = () => process.env.REVALIDATE_SECRET ?? '';

export const ticketStoreConfigured = () => apiBase().length > 0 && secret().length >= 32;

export async function saveTicket(id: string, report: BugReport, priority: Priority, reasons: string[]) {
  const body = JSON.stringify({
    id,
    name: report.name,
    contact: report.contact,
    category: report.category,
    title: report.title,
    description: report.description,
    urgency: report.urgency,
    stack: report.stack ?? '',
    link: report.link ?? '',
    page: report.page ?? '',
    priority,
    triageReasons: reasons,
  });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = `sha256=${createHmac('sha256', secret()).update(`${timestamp}.${body}`).digest('hex')}`;
  const response = await fetch(`${apiBase()}/api/CreateTicket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Timestamp': timestamp, 'X-Signature': signature },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`CreateTicket answered ${response.status}`);
}
