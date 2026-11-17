import type { Experience } from '@/lib/content';
import { LiveExperience } from '@/components/portfolio/live-experience';

/**
 * The Experience page in the Editorial look: the role told in acts, from shipping for real users
 * to building for AI. The acts are the experience data's own groups, put in story order; each
 * line of the data is one numbered beat. Shown only in Editorial (globals.css .ed-only).
 */

/** Story order and the title each group gets as an act. Groups not listed keep their own name, at the end. */
const ACTS: Record<string, string> = {
  'Client delivery': 'Shipping for real users',
  'Performance & tooling': 'Making it fast',
  'Architecture & R&D': 'Leading R&D',
  'AI platforms': 'Building for AI',
};
const ORDER = Object.keys(ACTS);
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

type Stat = { value: number; suffix?: string; label: string };

/** The years stat is shown as the live counter instead. */
const isYears = (s: Stat) => /years/i.test(s.label);

export function EditorialJourney({ experience, stats }: { experience: Experience; stats: Stat[] }) {
  const groups = [...experience.groups].sort((a, b) => {
    const rank = (label: string) => (ORDER.includes(label) ? ORDER.indexOf(label) : ORDER.length);
    return rank(a.label) - rank(b.label);
  });
  let beat = 0;

  return (
    <div className="ed-only ed-journey">
      <div className="ed-journey-role">
        <p>( The road so far )</p>
        <p>
          <strong>{experience.title}</strong> · {experience.company}
        </p>
        <p>
          {experience.duration} · {experience.location}
        </p>
      </div>

      <dl className="ed-journey-stats">
        {stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>
              {isYears(s) ? (
                <LiveExperience at={Date.now()} />
              ) : (
                <>
                  {s.value}
                  {s.suffix}
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <ol className="ed-acts">
        {groups.map((g, i) => (
          <li key={g.label} className="ed-act">
            <div className="ed-act-head">
              <span className="ed-act-no" aria-hidden>
                Act {ROMAN[i] ?? i + 1}
              </span>
              <h2>
                <span className="sr-only">Act {i + 1}: </span>
                {ACTS[g.label] ?? g.label}
              </h2>
              <p className="ed-act-label">{g.label}</p>
            </div>
            <ol className="ed-beats">
              {g.items.map((item) => {
                beat += 1;
                return (
                  <li key={item} className="ed-reveal">
                    <span className="ed-beat-no" aria-hidden>
                      {String(beat).padStart(2, '0')}
                    </span>
                    <p>{item}</p>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}
