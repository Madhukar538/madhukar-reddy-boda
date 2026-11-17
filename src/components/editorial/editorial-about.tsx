import { experienceSince } from '@/lib/utils';
import { fill } from '@/lib/story-text';
import type { StoryAbout } from '@/lib/story';
import { InlineText } from './inline-text';

/**
 * The About page in the Editorial look: a magazine-style Q&A in the owner's own words, from the
 * site's story (lib/story.ts: about), with {name}, {degree}, {institution}, {location} and {since}
 * filled in from the profile. Shown only in Editorial (globals.css .ed-only); the classic hero and
 * Overview are hidden there. A site whose story has no About section shows just its name.
 */

type Props = { name: string; education: { degree: string; institution: string; location: string }; about?: StoryAbout };

export function EditorialAbout({ name, education, about }: Props) {
  const values = { name, degree: education.degree, institution: education.institution, location: education.location, since: experienceSince().since };

  return (
    <div className="ed-only ed-about">
      <header className="ed-about-head">
        <p className="ed-story-kicker">( {about?.kicker ?? 'About'} )</p>
        {/* The page's heading in this look; a role, as the classic hero's <h1> is in the same page. */}
        <p role="heading" aria-level={1} className="ed-about-title">
          <InlineText text={fill(about?.title ?? name, values)} />
        </p>
        {about && <p className="ed-about-byline">{fill(about.byline, values)}</p>}
      </header>
      {about && about.qa.length > 0 && (
        <dl className="ed-qa">
          {about.qa.map(({ q, a }, i) => (
            <div key={q} className="ed-reveal">
              <dt>
                <span aria-hidden>Q{i + 1}</span>
                {q}
              </dt>
              <dd>
                <InlineText text={fill(a, values)} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
