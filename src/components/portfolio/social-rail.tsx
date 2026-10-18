'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Github, Linkedin, Mail, MapPin, Rss } from 'lucide-react';
import type { Profile, SocialLink } from '@/lib/content';
import { nowDate } from '@/lib/utils';

const icons = { GitHub: Github, LinkedIn: Linkedin };

const istTime = () =>
  new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });

/** Hyderabad's local time, refreshed every few seconds. A placeholder until mounted, so server and client HTML match. */
function LocalTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    setTime(istTime());
    const id = window.setInterval(() => setTime(istTime()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return <time suppressHydrationWarning>{time || '··:··'}</time>;
}

/**
 * Docks the profile card (html[data-profile-docked], styled in globals.css)
 * whenever the big portrait isn't on screen: on pages without one, in looks
 * that hide it, and on Home and About once it has mostly scrolled away.
 */
function useProfileDock(pathname: string) {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const portrait = document.querySelector('.portrait-frame');
      const visible = portrait !== null && portrait.getClientRects().length > 0;
      const docked = !visible || portrait.getBoundingClientRect().bottom < window.innerHeight * 0.4;
      root.toggleAttribute('data-profile-docked', docked);
    };
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Switching between looks shows or hides the portrait.
    const looks = new MutationObserver(schedule);
    looks.observe(root, { attributes: true, attributeFilter: ['data-style'] });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      looks.disconnect();
      root.removeAttribute('data-profile-docked');
    };
  }, [pathname]);
}

type RailLink = { href: string; icon: typeof Mail; label: string; external: boolean };

/** The contact icons, stacked vertically. */
function RailLinks({ links }: { links: RailLink[] }) {
  return (
    <ul className="flex flex-col items-center gap-1.5">
      {links.map(({ href, icon: Icon, label, external }) => (
        <li key={label}>
          <a
            href={href}
            aria-label={label}
            title={label}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-primary"
          >
            <Icon className="h-[1.05rem] w-[1.05rem]" />
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * The left edge of every page (styles in globals.css):
 * - wide screens: a thin strip of contact links joined by a fine line, with
 *   Hyderabad's local time written sideways beneath;
 * - very wide screens: a sticky profile card beside the strip, wherever the
 *   big portrait isn't showing (see useProfileDock);
 * - phones and tablets (Midnight look, on pages with the portrait across the
 *   top): the links down the left of the photo and the time down the right.
 */
export function SocialRail({ profile, socialLinks }: { profile: Profile; socialLinks: SocialLink[] }) {
  const pathname = usePathname();
  useProfileDock(pathname);
  if (pathname.startsWith('/admin')) return null;

  const links: RailLink[] = [
    ...socialLinks.map(({ network, href }) => ({ href, icon: icons[network], label: network, external: true })),
    { href: `mailto:${profile.email}`, icon: Mail, label: 'Email', external: false },
    { href: '/rss.xml', icon: Rss, label: 'RSS feed', external: false },
  ];
  return (
    <>
      <aside aria-label="Contact links" className="social-rail">
        <span aria-hidden className="social-rail-line" />
        <RailLinks links={links} />
        <span aria-hidden className="social-rail-line" />
        <p className="social-rail-time">
          Hyderabad · <LocalTime /> IST
        </p>
      </aside>

      <aside aria-label="Contact links" className="mobile-rails">
        <div className="flex flex-col items-center gap-2">
          <span aria-hidden className="social-rail-line" />
          <RailLinks links={links} />
          <span aria-hidden className="social-rail-line" />
        </div>
        <p aria-hidden className="social-rail-time">
          Hyderabad · <LocalTime /> IST
        </p>
      </aside>

      <aside aria-label="About Madhukar" className="profile-dock glass overflow-hidden">
        <Link href="/about" className="group block">
          <div className="profile-dock-photo">
            <Image src="/portrait-cutout.webp" alt="" fill quality={60} sizes="256px" className="object-cover object-top" />
          </div>
          <div className="px-5 pt-3">
            <p className="text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">{profile.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">Software Architect</p>
          </div>
        </Link>
        <p className="flex items-center gap-1.5 px-5 pt-1.5 text-sm text-muted-foreground">
          <MapPin aria-hidden className="h-3.5 w-3.5" /> Hyderabad, India
        </p>
        <div className="mx-5 mt-3.5 mb-4 border-t border-foreground/10 pt-3.5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span aria-hidden className="now-pulse" /> Now
            {profile.nowUpdatedAt && <span className="font-normal normal-case tracking-normal">· {nowDate(profile.nowUpdatedAt)}</span>}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{profile.now}</p>
        </div>
        <Link
          href="/work-with-me"
          className="flex items-center justify-between border-t border-foreground/10 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-foreground/5"
        >
          Work with me <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </aside>
    </>
  );
}
