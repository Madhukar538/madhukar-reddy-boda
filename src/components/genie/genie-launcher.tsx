'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
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
        className={cn(
          'genie-button fixed right-4 z-[110] flex h-14 w-14 items-center justify-center rounded-full text-white transition-[transform,opacity] duration-300 active:scale-90',
          // Phones: above the floating tab bar. Desktop: the usual corner.
          'bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.75rem)] lg:bottom-6 lg:right-6',
          // On phones the open sheet has its own close button, so the bubble steps aside.
          open && 'max-sm:pointer-events-none max-sm:scale-75 max-sm:opacity-0'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>
      {loaded && <GenieChat open={open} onClose={close} email={email} />}
    </div>
  );
}
