'use client';

import { useEffect, useState } from 'react';

/**
 * How long Madhukar has been building, counted live to the second: "4y 10m 21d" and a running
 * "20h 31m 45s", from his first day, 27 Dec 2021, in IST. The server renders the moment the page
 * was built (`at`), the browser hydrates with that same moment, then switches to its own clock and
 * ticks every second.
 */

/** The first day, at midnight in Hyderabad: 27 Dec 2021 (lib/utils CAREER_START). */
const START = { year: 2021, month: 11, day: 27 }; // months from 0
const IST = 5.5 * 60 * 60 * 1000;

/** Years, months and days since the start, then the time since the last midnight, all in IST. */
function parts(now: number) {
  const d = new Date(now + IST);
  let years = d.getUTCFullYear() - START.year;
  let months = d.getUTCMonth() - START.month;
  // Before the 27th, this month's anniversary hasn't come yet.
  if (d.getUTCDate() < START.day) months -= 1;
  while (months < 0) {
    years -= 1;
    months += 12;
  }
  // Days since the last monthly anniversary (the 27th, or the month's last day if it is shorter).
  const anchorMonth = d.getUTCDate() >= START.day ? d.getUTCMonth() : d.getUTCMonth() - 1;
  const anchorYear = d.getUTCFullYear() + Math.floor(anchorMonth / 12);
  const m = ((anchorMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(anchorYear, m + 1, 0)).getUTCDate();
  const anchor = Date.UTC(anchorYear, m, Math.min(START.day, lastDay));
  const into = d.getTime() - anchor;
  const days = Math.floor(into / 86_400_000);
  const rest = into % 86_400_000;
  return {
    years,
    months,
    days,
    hours: Math.floor(rest / 3_600_000),
    minutes: Math.floor((rest % 3_600_000) / 60_000),
    seconds: Math.floor((rest % 60_000) / 1000),
  };
}

const two = (n: number) => String(n).padStart(2, '0');

export function LiveExperience({ at, className }: { at: number; className?: string }) {
  // Start from the server's moment so hydration matches exactly, then take the real time at once.
  const [now, setNow] = useState(at);
  useEffect(() => {
    setNow(Date.now());
    // Tick on the second boundary, so every second shows for a full second.
    let timer = window.setTimeout(function tick() {
      setNow(Date.now());
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    }, 1000 - (Date.now() % 1000));
    return () => window.clearTimeout(timer);
  }, []);
  const p = parts(now);
  return (
    <span className={`live-xp ${className ?? ''}`}>
      <span className="live-xp-main" aria-hidden>
        {`${p.years}y ${p.months}m ${p.days}d`}
      </span>
      <span className="live-xp-clock" aria-hidden>
        <span className="live-xp-dot" aria-hidden />
        <span>{`${two(p.hours)}h ${two(p.minutes)}m ${two(p.seconds)}s`}</span>
      </span>
      <span className="sr-only">
        {`${p.years} years and ${p.months} months of experience, since 27 December 2021`}
      </span>
    </span>
  );
}
