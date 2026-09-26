import { cn } from '@/lib/utils';

/**
 * Words that roll up one line at a time, holding each for about two seconds.
 * CSS only (see .rolling in globals.css), so it needs no JavaScript and
 * doesn't delay the headline. The keyframes are written for exactly four
 * words. Screen readers and reduced-motion visitors get the first word only.
 */
export function RollingText({
  words,
  className,
}: {
  words: [string, string, string, string];
  className?: string;
}) {
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a));
  return (
    <span className={cn('rolling', className)}>
      <span className="sr-only">{words[0]}</span>
      <span aria-hidden className="rolling-sizer">
        {longest}
      </span>
      <span aria-hidden className="rolling-track">
        {[...words, words[0]].map((word, i) => (
          <span key={i} className="rolling-word">
            {word}
          </span>
        ))}
      </span>
    </span>
  );
}
