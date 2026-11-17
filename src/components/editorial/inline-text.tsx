import { Fragment } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { isSafeHref } from '@/lib/story-text';

/**
 * Story text with its only markup: **bold**, *emphasis* and [label](/path) links (to a page on the
 * site or an https address; anything else stays plain text). Everything else is plain text (React
 * escapes it), so a stored story can't inject HTML.
 */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
        if (link && isSafeHref(link[2])) {
          const external = link[2].startsWith('https://');
          return (
            <Link key={i} href={link[2]} className="ed-link" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {link[1]} <ArrowUpRight className="h-4 w-4" />
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
