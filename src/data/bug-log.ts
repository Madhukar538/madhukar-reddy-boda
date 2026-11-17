/**
 * Bugs fixed, for the public bug log (/bug-log) and the count on Fix a bug.
 * Real fixes only, each in the reporter-safe words below: no client names unless they agreed.
 * While this list is empty the page answers 404 and nothing links to it.
 */

export type FixedBug = {
  /** Short title, e.g. "Checkout API timing out at 300 rps". */
  title: string;
  /** When it was fixed, e.g. "Oct 2026". */
  when: string;
  /** The stack it was in, e.g. ".NET 8 · SQL Server". */
  stack: string;
  /** What people saw. */
  symptom: string;
  /** Why it happened. */
  cause: string;
  /** What changed. */
  fix: string;
  /** The measurable result, if there is one. */
  result?: string;
};

export const bugLog: FixedBug[] = [];
