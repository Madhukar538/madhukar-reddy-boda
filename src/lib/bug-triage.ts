import { z } from 'zod';
import { CATEGORIES, URGENCIES } from './bug-report-options';

/**
 * "Hire me for a bug": shared schema plus the server-side triage that turns
 * a visitor's report into a prioritised ticket.
 */

export const bugReportSchema = z.object({
  name: z.string().trim().min(2, 'Please add your name').max(80),
  contact: z
    .string()
    .trim()
    .min(3, 'Add an email or Telegram @handle')
    .max(120)
    .refine((v) => /^\S+@\S+\.\S+$/.test(v) || /^@?[A-Za-z0-9_]{5,32}$/.test(v), 'Use an email or a Telegram @handle'),
  category: z.enum(CATEGORIES),
  urgency: z.enum(URGENCIES),
  stack: z.string().trim().max(120).optional().default(''),
  title: z.string().trim().min(6, 'A short title, please').max(120),
  description: z.string().trim().min(20, 'Tell me a bit more (20+ characters)').max(4000),
  link: z
    .string()
    .trim()
    .max(300)
    .optional()
    .default('')
    .refine((v) => v === '' || /^https?:\/\/\S+$/.test(v), 'Links must start with http(s)://'),
  // The page the ticket was filed from (the genie sends it; the form page doesn't).
  page: z
    .string()
    .trim()
    .max(200)
    .optional()
    .default('')
    .refine((v) => v === '' || v.startsWith('/'), 'Page must be a site path'),
  // Anti-spam: a hidden field bots fill in, and the time the form was opened.
  website: z.string().optional().default(''),
  startedAt: z.number().optional(),
});

export type BugReport = z.infer<typeof bugReportSchema>;

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

const SIGNALS: [RegExp, number, string][] = [
  [/\b(prod(uction)?|live|customers?|outage|down)\b/i, 2, 'production impact'],
  [/\b(data ?loss|corrupt(ed|ion)?|security|breach|leak|vulnerab)/i, 3, 'data/security risk'],
  [/\b(crash(es|ing)?|exception|500|timeout|deadlock|memory leak|oom)\b/i, 1, 'crash/error'],
  [/\b(slow|latency|p9[59]|throughput|cpu|high load)\b/i, 1, 'performance'],
];

/** Scores urgency plus keywords in the report into a priority and the reasons for it. */
export function triage(report: BugReport): { priority: Priority; reasons: string[] } {
  const text = `${report.title}\n${report.description}`;
  let score = URGENCIES.indexOf(report.urgency) * 2;
  const reasons: string[] = [report.urgency.toLowerCase()];
  for (const [pattern, weight, label] of SIGNALS) {
    if (pattern.test(text)) {
      score += weight;
      reasons.push(label);
    }
  }
  const priority: Priority = score >= 6 ? 'P1' : score >= 4 ? 'P2' : score >= 2 ? 'P3' : 'P4';
  return { priority, reasons };
}

/** e.g. BUG-250923-K7QX */
export function ticketId(now = new Date()) {
  const date = now.toISOString().slice(2, 10).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `BUG-${date}-${suffix}`;
}
