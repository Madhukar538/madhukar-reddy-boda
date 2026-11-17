'use client';

import { useEffect, useState } from 'react';

/**
 * How long Madhukar has been building, counted live to the second: "4y 11m 16d" and a running
 * "20h 31m 45s". It counts from the first of the career's start month in IST (lib/utils
 * CAREER_START is a month, "Dec 2021"). The server renders the moment the page was built; the
 * browser takes over and ticks every second (suppressHydrationWarning: the two differ by design).
 */

const START = { year: 2021, month: 11 }; // December 2021 (months from 0), from CAREER_START
const IST = 5.5 * 60 * 60 * 1000;

function parts(now: number) {
  // Calendar maths in IST, so a new day starts at midnight in Hyderabad.
  const d = new Date(now + IST);
  let years = d.getUTCFullYear() - START.year;
  let months = d.getUTCMonth() - START.month;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const into = d.getTime() - monthStart;
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

export function LiveExperience({ className }: { className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // Tick on the second boundary, so every second shows for a full second.
    let timer = window.setTimeout(function tick() {
      setNow(Date.now());
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    }, 1000 - (Date.now() % 1000));
    return () => window.clearTimeout(timer);
  }, []);
  const p = parts(now);
  return (
    <span className={`live-xp ${className ?? ''}`} suppressHydrationWarning>
      <span className="live-xp-main" aria-hidden suppressHydrationWarning>
        {p.years}y {p.months}m {p.days}d
      </span>
      <span className="live-xp-clock" aria-hidden suppressHydrationWarning>
        <span className="live-xp-dot" aria-hidden />
        {two(p.hours)}h {two(p.minutes)}m {two(p.seconds)}s
      </span>
      <span className="sr-only">
        {p.years} years and {p.months} months of experience, since December 2021
      </span>
    </span>
  );
}
