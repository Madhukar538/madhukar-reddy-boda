import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Stable in-page anchor for a card title, e.g. "MCP Server (x)" -> "mcp-server-x". */
export const anchorId = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** When the Now note last changed, for display (e.g. "18 Oct 2026"); empty when unknown. */
export const nowDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';

/** When Madhukar's career started (his first day at Revalsys); the experience data's duration starts the same month. */
export const CAREER_START = '27 Dec 2021';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Whole years of experience from a start like "27 Dec 2021", or a duration like "Dec 2021 – Present"
 * (read as the 1st) or "2021 – Present" (read as January), so "5+ years" only appears once five full
 * years have passed. The label is the month and year ("Dec 2021").
 */
export function experienceSince(duration: string = CAREER_START, now: Date = new Date()) {
  const match = duration.match(/(?:(\d{1,2})\s+)?(?:([A-Za-z]{3})[a-z]*\s+)?(\d{4})/);
  const day = Number(match?.[1] ?? 1);
  const year = Number(match?.[3] ?? 2021);
  const monthIndex = Math.max(0, MONTHS.indexOf((match?.[2] ?? 'jan').toLowerCase()));
  // A month only counts once its day has come round.
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() - monthIndex) - (now.getDate() < day ? 1 : 0);
  const label = match?.[2] ? `${match[2]} ${year}` : String(year);
  return { years: Math.max(0, Math.floor(months / 12)), since: label };
}
