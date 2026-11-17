import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The link to the next part of the story at the end of a page, so the Editorial look reads as
 * one journey: Home → Experience → Projects → About → Fix a bug. Shown only in Editorial.
 */

export const STORY = [
  { href: '/', title: 'The journey so far' },
  { href: '/experience', title: 'The road so far' },
  { href: '/projects', title: 'The case files' },
  { href: '/about', title: 'In my own words' },
  { href: '/fix-a-bug', title: 'Bring me a bug' },
] as const;

export function EditorialNext({ from }: { from: (typeof STORY)[number]['href'] }) {
  const i = STORY.findIndex((s) => s.href === from);
  const next = STORY[i + 1];
  if (!next) return null;
  return (
    <nav className="ed-only ed-next" aria-label="Next chapter">
      <Link href={next.href} className="ed-next-link">
        <span className="ed-next-kicker">
          Next chapter · {String(i + 2).padStart(2, '0')} of {String(STORY.length).padStart(2, '0')}
        </span>
        <span className="ed-next-title">
          {next.title}
          <ArrowRight aria-hidden />
        </span>
      </Link>
    </nav>
  );
}
