import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Story } from '@/lib/story';
import { ChapterExhibit } from './chapter-exhibit';
import { InlineText } from './inline-text';

/**
 * The Editorial homepage told as a journey, in chapters from the site's story (lib/story.ts).
 * Each chapter's number stays pinned beside it while you read it; a line down the left fills as
 * you go (components/editorial/editorial-fx.tsx scales .ed-chapters-fill).
 */

export function EditorialStory({ story }: { story: Story['story'] }) {
  return (
    <section className="ed-story" aria-labelledby="ed-story-title">
      <header className="ed-story-head">
        <p className="ed-story-kicker">( {story.kicker} )</p>
        <h2 id="ed-story-title">
          <InlineText text={story.headline} />
        </h2>
      </header>
      <ol className="ed-chapters">
        <li aria-hidden className="ed-chapters-fill" />
        {story.chapters.map((c) => (
          <li key={c.no} className="ed-chapter">
            <div className="ed-chapter-mark" aria-hidden>
              <span className="ed-chapter-no">{c.no}</span>
            </div>
            <div className="ed-chapter-text ed-reveal">
              <p className="ed-chapter-era">
                <span className="sr-only">Chapter {c.no}: </span>
                {c.era}
              </p>
              <h3>{c.title}</h3>
              <p className="ed-chapter-body">{c.body}</p>
              {c.proof && <p className="ed-chapter-proof">{c.proof}</p>}
              {c.links && (
                <p className="ed-chapter-links">
                  {c.links.map((l) => (
                    <Link key={l.href} href={l.href} className="ed-link" {...(l.href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {l.label} <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ))}
                </p>
              )}
            </div>
            <ChapterExhibit exhibit={c.exhibit} />
          </li>
        ))}
      </ol>
    </section>
  );
}
