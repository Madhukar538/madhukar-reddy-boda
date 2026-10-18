'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Github, Linkedin, Mail, MapPin, Rss } from 'lucide-react';
import type { Profile, SocialLink } from '@/lib/content';
import { now } from '@/data/now';

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

/** True once the element with this id has scrolled out of view. */
function useScrolledPast(id: string) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const target = document.getElementById(id);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) =>
      setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [id]);
  return past;
}

/**
 * The left edge of the home page on wide screens (styles in globals.css):
 * - a thin strip of contact links joined by a fine line, with Hyderabad's
 *   local time written sideways beneath;
 * - once the hero has scrolled away, the portrait docks there instead as a
 *   sticky profile card (very wide screens only, where the gutter fits it).
 * Phones and narrow screens have the footer and the hero portrait.
 */
export function SocialRail({ profile, socialLinks, heroId }: { profile: Profile; socialLinks: SocialLink[]; heroId: string }) {
  const docked = useScrolledPast(heroId);
  const links = [
    ...socialLinks.map(({ network, href }) => ({ href, icon: icons[network], label: network, external: true })),
    { href: `mailto:${profile.email}`, icon: Mail, label: 'Email', external: false },
    { href: '/rss.xml', icon: Rss, label: 'RSS feed', external: false },
  ];
  const linkList = (className: string) => (
    <ul className={className}>
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

  return (
    <div className="home-edge" data-docked={docked || undefined}>
      <aside aria-label="Contact links" className="social-rail">
        <span aria-hidden className="social-rail-line" />
        {linkList('flex flex-col items-center gap-1.5')}
        <span aria-hidden className="social-rail-line" />
        <p className="social-rail-time">
          Hyderabad · <LocalTime /> IST
        </p>
      </aside>

      <aside aria-label="About Madhukar" className="profile-dock glass overflow-hidden">
        <Link href="/about" className="group block">
          <div className="profile-dock-photo">
            <Image src="/portrait-cutout.webp" alt="" fill quality={60} sizes="208px" className="object-cover object-[50%_18%]" />
          </div>
          <div className="px-4 pt-3">
            <p className="font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">{profile.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Software Architect</p>
          </div>
        </Link>
        <p className="flex items-center gap-1.5 px-4 pt-2 text-xs text-muted-foreground tabular-nums">
          <MapPin aria-hidden className="h-3.5 w-3.5" /> Hyderabad · <LocalTime /> IST
        </p>
        <div className="mx-4 mt-3 border-t border-foreground/10 pt-3">
          <p className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span aria-hidden className="now-pulse" /> Now
          </p>
          <p className="mt-1.5 text-[0.8rem] leading-relaxed text-foreground/85">{now.focus}</p>
        </div>
        {linkList('flex items-center justify-between px-2.5 py-2.5 mt-1')}
      </aside>
    </div>
  );
}
