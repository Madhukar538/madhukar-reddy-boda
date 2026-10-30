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

/** When Madhukar's career started (his Revalsys start); the experience data's duration starts the same way. */
export const CAREER_START = 'Dec 2021';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Whole years of experience from a duration like "Dec 2021 – Present" (or "2021 – Present",
 * read as January), so "5+ years" only appears once five full years have passed.
 */
export function experienceSince(duration: string = CAREER_START, now: Date = new Date()) {
  const match = duration.match(/(?:([A-Za-z]{3})[a-z]*\s+)?(\d{4})/);
  const year = Number(match?.[2] ?? 2021);
  const monthIndex = Math.max(0, MONTHS.indexOf((match?.[1] ?? 'jan').toLowerCase()));
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() - monthIndex);
  const label = match?.[1] ? `${match[1]} ${year}` : String(year);
  return { years: Math.max(0, Math.floor(months / 12)), since: label };
}
