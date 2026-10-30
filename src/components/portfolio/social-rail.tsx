'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, FileDown, Github, Linkedin, Mail, Rss } from 'lucide-react';
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

      {/* Drawn as a node of the architecture diagram behind it: a service header,
          the portrait, then a spec sheet in mono. */}
      <aside aria-label="About Madhukar" className="profile-dock glass overflow-hidden">
        <p className="flex items-center justify-between border-b border-foreground/10 px-4 py-2 font-mono text-[0.7rem] text-muted-foreground">
          <span>profile.svc</span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="now-pulse" /> online
          </span>
        </p>
        <Link href="/about" className="group block">
          <div className="profile-dock-photo">
            <Image src="/portrait-cutout.webp" alt="" fill quality={90} sizes="256px" className="object-cover object-[50%_12%]" />
          </div>
          <div className="-mt-6 px-4">
            <p className="font-serif text-[1.65rem] leading-[1.05] text-foreground group-hover:text-primary transition-colors">{profile.name}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {profile.title} · {profile.company.split(' ')[0]}
            </p>
          </div>
        </Link>

        <dl className="mx-4 mt-4 grid grid-cols-[4.25rem_1fr] gap-y-1.5 border-t border-foreground/10 pt-3.5 font-mono text-[0.72rem]">
          <dt className="text-muted-foreground">loc</dt>
          <dd className="text-foreground/85">Hyderabad, IN</dd>
          <dt className="text-muted-foreground">time</dt>
          <dd className="text-foreground/85 tabular-nums"><LocalTime /> IST</dd>
          <dt className="text-muted-foreground">stack</dt>
          <dd className="text-foreground/85">.NET · RAG · MCP</dd>
          <dt className="text-muted-foreground">status</dt>
          <dd className="text-primary">open to work</dd>
        </dl>

        <div className="mx-4 mt-3.5 border-t border-foreground/10 pt-3.5">
          <p className="font-mono text-[0.7rem] text-muted-foreground">
            now{profile.nowUpdatedAt && <span> · {nowDate(profile.nowUpdatedAt)}</span>}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{profile.now}</p>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] border-t border-foreground/10 text-sm">
          <Link
            href="/work-with-me"
            className="flex items-center justify-between px-4 py-3 font-medium text-foreground transition-colors hover:bg-foreground/5 hover:text-primary"
          >
            Work with me <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
          <a
            href="/resume.pdf"
            download="Boda-Madhukar-Reddy-Resume.pdf"
            aria-label="Download résumé (PDF)"
            title="Résumé (PDF)"
            className="flex items-center border-l border-foreground/10 px-4 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <FileDown aria-hidden className="h-4 w-4" />
          </a>
        </div>
      </aside>
    </>
  );
}
