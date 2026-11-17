import type { Experience } from '@/lib/content';
import { LiveExperience } from '@/components/portfolio/live-experience';
import type { StoryJourney } from '@/lib/story';

/**
 * The Experience page in the Editorial look: the role told in acts, from shipping for real users
 * to building for AI. The acts are the experience data's own groups, put in the story's order with
 * its act titles (lib/story.ts: journey); groups it doesn't list keep their own name, at the end.
 * Each line of the data is one numbered beat. Shown only in Editorial (globals.css .ed-only).
 */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

type Stat = { value: number; suffix?: string; label: string };

/** The years stat is shown as the live counter instead. */
const isYears = (s: Stat) => /years/i.test(s.label);

export function EditorialJourney({ experience, stats, journey }: { experience: Experience; stats: Stat[]; journey?: StoryJourney }) {
  const order = journey?.acts.map((a) => a.group) ?? [];
  const titleOf = (label: string) => journey?.acts.find((a) => a.group === label)?.title ?? label;
  const groups = [...experience.groups].sort((a, b) => {
    const rank = (label: string) => (order.includes(label) ? order.indexOf(label) : order.length);
    return rank(a.label) - rank(b.label);
  });
  let beat = 0;

  return (
    <div className="ed-only ed-journey">
      <div className="ed-journey-role">
        <p>( {journey?.kicker ?? 'The road so far'} )</p>
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
                {titleOf(g.label)}
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
