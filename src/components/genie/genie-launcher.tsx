'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { GenieIcon } from './genie-icon';
import { cn } from '@/lib/utils';

// The chat itself loads only when someone opens it (or points at the button),
// so pages don't carry its code until it's wanted.
const loadChat = () => import('./genie-chat').then((m) => m.GenieChat);
const GenieChat = dynamic(loadChat, { ssr: false });

// Pages where the genie would get in the way or repeat what's already there.
const HIDDEN_ON = [/^\/admin(\/|$)/, /^\/fix-a-bug(\/|$)/];

/**
 * The genie: a floating button on every page that opens a chat for filing a
 * ticket, which lands on the owner's phone through Telegram (/api/bug-report).
 * On phones it sits just above the floating tab bar and opens as a bottom sheet.
 */
export function GenieLauncher({ email }: { email: string }) {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Starts tucked: pages open on the hero, where the button would cover its buttons (phones only, in CSS).
  const [tucked, setTucked] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const warm = useCallback(() => void loadChat(), []);
  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Open straight into the chat from anywhere, e.g. a link to "#genie".
  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === '#genie') {
        setLoaded(true);
        setOpen(true);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  // Phones and tablets: while you scroll down, the button slides mostly off the edge so it
  // doesn't sit on what you're reading. It comes back when you scroll up or stop scrolling,
  // except over the first screen, where it would cover the hero's buttons.
  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)');
    const inHero = () => narrow.matches && window.scrollY < window.innerHeight * 0.6;
    let lastY = window.scrollY;
    let idle = 0;
    setTucked(inHero());
    const onScroll = () => {
      const y = window.scrollY;
      if (narrow.matches && Math.abs(y - lastY) > 6) setTucked((y > lastY && y > 80) || inHero());
      lastY = y;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setTucked(inHero()), 900);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(idle);
    };
  }, []);

  if (HIDDEN_ON.some((re) => re.test(pathname))) return null;

  return (
    <div className="genie-root">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setLoaded(true);
          setOpen((o) => !o);
        }}
        onPointerEnter={warm}
        onFocus={warm}
        onTouchStart={warm}
        aria-expanded={open}
        aria-controls="genie-chat"
        aria-label={open ? 'Close the genie' : 'Stuck on something? Ask the genie to file a ticket'}
        data-tucked={tucked && !open ? '' : undefined}
        className={cn(
          'genie-button fixed right-4 z-[110] flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full text-white transition-[transform,opacity] duration-300 active:scale-90',
          // Phones: above the floating tab bar. Desktop: the usual corner.
          'bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.75rem)] lg:bottom-6 lg:right-6',
          // On phones the open sheet has its own close button, so the bubble steps aside.
          open && 'max-sm:pointer-events-none max-sm:scale-75 max-sm:opacity-0'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <GenieIcon className="h-6 w-6" />}
      </button>
      {loaded && <GenieChat open={open} onClose={close} email={email} />}
    </div>
  );
}
