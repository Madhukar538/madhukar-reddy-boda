'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, User, FlaskConical, Handshake, Mail, PenLine, Phone, FolderKanban, Search, Settings2, Tags, X } from 'lucide-react';
import { openQuickSwitcher } from '@/lib/vault-client';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { AnimatePresence, m } from 'framer-motion';
import { LiquidLens } from '@/components/liquid-lens';
import { OsModeToggle } from '@/components/os/os-mode';

// Every page on the site — each one is its own URL.
// The blog is the home page; the portfolio pages follow it.
export const navLinks = [
  { href: '/',           label: 'Blog',       icon: PenLine },
  { href: '/topics',     label: 'Topics',     icon: Tags },
  { href: '/projects',   label: 'Projects',   icon: FolderKanban },
  { href: '/lab',        label: 'Lab',        icon: FlaskConical },
  { href: '/experience', label: 'Experience', icon: Briefcase },
  { href: '/about',      label: 'About',      icon: User },
];

// Mobile tab bar — capped to 5 so it fits a 320px screen.
// The Lab is reachable from About and the Projects page.
const tabLinks = [
  { href: '/',           label: 'Blog',    icon: PenLine },
  { href: '/topics',     label: 'Topics',  icon: Tags },
  { href: '/projects',   label: 'Work',    icon: FolderKanban },
  { href: '/experience', label: 'Career',  icon: Briefcase },
  { href: '/about',      label: 'About',   icon: User },
];

export function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname.startsWith('/blog');
  if (href === '/projects') return pathname.startsWith('/projects') || pathname.startsWith('/lab');
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Wide screens have room beside the content for the docked tabs (content is max-w-6xl).
const DOCK_QUERY = '(min-width: 1280px)';
// Dock a little way down the page; undock nearer the top, so it doesn't flicker at the line.
const DOCK_AT = 160;
const UNDOCK_AT = 80;

/** How to reach Madhukar, offered in the docked tabs. */
export type NavContact = { email: string; phone: string; phoneHref: string };

export function Navbar({ contact }: { contact: NavContact }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [docked, setDocked] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  useEffect(() => setControlsOpen(false), [pathname]);

  useEffect(() => {
    const wide = window.matchMedia(DOCK_QUERY);
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      setDocked((was) => wide.matches && (was ? y > UNDOCK_AT : y > DOCK_AT));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    wide.addEventListener('change', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      wide.removeEventListener('change', onScroll);
    };
  }, []);

  return (
    <>
      {/* ── Desktop floating glass capsule. On wide screens, scrolling down sends it flowing
             along the top edge into the corner, where it pours down the right edge as tabs. ── */}
      <header
        data-docked={docked ? '' : undefined}
        inert={docked}
        aria-hidden={docked || undefined}
        className="vt-nav nav-flow-top hidden lg:flex fixed top-4 inset-x-0 z-[100] justify-center px-6 pointer-events-none"
      >
        <div
          className={cn(
            'nav-flow-capsule glass glass-strong glass-pill pointer-events-auto flex items-center gap-2 px-2 py-1.5 transition-shadow duration-500',
            scrolled && 'shadow-2xl'
          )}
        >
          <LiquidLens />
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-sm font-semibold text-foreground hover:bg-foreground/5 transition-colors"
          >
            <Image src="/icons/icon-192.png" alt="" width={28} height={28} className="h-7 w-7 rounded-full ring-1 ring-foreground/15" />
            Madhukar
          </Link>

          <div className="h-5 w-px bg-foreground/10" />

          <nav className="flex items-center gap-0.5" aria-label="Main">
            {navLinks.map((link) => {
              // Lab has its own entry on desktop, so match it exactly here.
              const isActive =
                link.href === '/projects'
                  ? pathname.startsWith('/projects')
                  : isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative px-3.5 py-1.5 text-[13px] font-medium rounded-full transition-colors duration-200',
                    isActive ? 'text-foreground' : 'text-foreground/60 hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <m.span
                      layoutId="nav-pill"
                      className="nav-active-pill absolute inset-0 rounded-full bg-foreground/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_0.5px_rgba(255,255,255,0.15)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="h-5 w-px bg-foreground/10" />

          <div className="flex items-center">
            <button
              type="button"
              onClick={openQuickSwitcher}
              aria-label="Search notes (⌘K)"
              title="Search notes (⌘K)"
              className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <Search className="h-[1.05rem] w-[1.05rem]" />
              <kbd className="rounded px-1 text-[10px] font-medium text-muted-foreground ring-1 ring-foreground/15">⌘K</kbd>
            </button>
            <OsModeToggle />
            <ThemeSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Wide screens, scrolled: the same links as tabs down the right edge ── */}
      <nav
        aria-label="Main"
        data-open={docked ? '' : undefined}
        inert={!docked}
        aria-hidden={!docked || undefined}
        className="nav-dock glass glass-strong"
        style={{ '--n': navLinks.length + 7 } as React.CSSProperties}
      >
        <Link href="/" title="Madhukar" className="nav-dock-item" style={{ '--i': 0 } as React.CSSProperties}>
          <Image src="/icons/icon-192.png" alt="Home" width={28} height={28} className="h-7 w-7 rounded-full ring-1 ring-foreground/15" />
        </Link>
        <span aria-hidden className="nav-dock-item h-px w-6 bg-foreground/10" style={{ '--i': 1 } as React.CSSProperties} />
        {navLinks.map((link, i) => {
          const Icon = link.icon;
          const isActive =
            link.href === '/projects' ? pathname.startsWith('/projects') : isActivePath(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn('nav-dock-item nav-dock-tab group', isActive ? 'text-foreground' : 'text-foreground/60 hover:text-foreground')}
              style={{ '--i': i + 2 } as React.CSSProperties}
            >
              {isActive && (
                <m.span
                  layoutId="dock-pill"
                  className="nav-active-pill absolute inset-0 rounded-full bg-foreground/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_0.5px_rgba(255,255,255,0.15)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="relative h-[1.1rem] w-[1.1rem]" strokeWidth={isActive ? 2.4 : 2} />
              <span className="nav-dock-label">{link.label}</span>
            </Link>
          );
        })}
        <span aria-hidden className="nav-dock-item h-px w-6 bg-foreground/10" style={{ '--i': navLinks.length + 2 } as React.CSSProperties} />
        {[
          { href: contact.phoneHref, label: `Call ${contact.phone}`, icon: Phone },
          { href: `mailto:${contact.email}`, label: 'Email me', icon: Mail },
        ].map((item, i) => (
          <a
            key={item.label}
            href={item.href}
            aria-label={item.label}
            className="nav-dock-item nav-dock-tab text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
            style={{ '--i': navLinks.length + 3 + i } as React.CSSProperties}
          >
            <item.icon className="h-[1.1rem] w-[1.1rem]" />
            <span className="nav-dock-label">{item.label}</span>
          </a>
        ))}
        <Link
          href="/work-with-me"
          aria-current={pathname === '/work-with-me' ? 'page' : undefined}
          className="nav-dock-item nav-dock-tab nav-dock-cta"
          style={{ '--i': navLinks.length + 5 } as React.CSSProperties}
        >
          <Handshake className="h-[1.1rem] w-[1.1rem]" />
          <span className="nav-dock-label">Work with me</span>
        </Link>
        <span aria-hidden className="nav-dock-item h-px w-6 bg-foreground/10" style={{ '--i': navLinks.length + 6 } as React.CSSProperties} />
        <div className="nav-dock-item" style={{ '--i': navLinks.length + 7 } as React.CSSProperties}>
          <button
            type="button"
            onClick={openQuickSwitcher}
            aria-label="Search notes (⌘K)"
            title="Search notes (⌘K)"
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <Search className="h-[1.05rem] w-[1.05rem]" />
          </button>
          <ThemeToggle />
        </div>
      </nav>

      {/* ── Mobile / tablet floating tab bar ── */}
      <div className="vt-tabbar lg:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-0 z-[100] flex items-end justify-center gap-1.5 min-[360px]:gap-2 px-2 pointer-events-none">
        {/* No LiquidLens here: its refraction keeps the text behind the bar sharp, which fights the labels. */}
        <nav className="glass glass-strong glass-bar glass-pill pointer-events-auto flex items-center p-1" aria-label="Main">
          {tabLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex w-[2.875rem] min-[360px]:w-[3.25rem] sm:w-16 flex-col items-center justify-center py-1.5 rounded-full transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-foreground/70 hover:text-foreground'
                )}
              >
                {isActive && (
                  <m.span
                    layoutId="mobile-pill"
                    className="nav-active-pill absolute inset-0 rounded-full bg-foreground/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative h-[1.15rem] w-[1.15rem]" strokeWidth={isActive ? 2.4 : 2} />
                <span className="relative text-[11px] font-medium mt-0.5">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* One detached button, like iOS 26's separate tab-bar button; opens the display controls. */}
        <div className="relative pointer-events-auto">
          <AnimatePresence>
            {controlsOpen && (
              <>
                <div className="fixed inset-0 -z-10" onClick={() => setControlsOpen(false)} />
                <m.div
                  id="display-controls"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="glass glass-strong glass-bar glass-pill absolute bottom-full right-0 mb-2 flex flex-col items-center p-1 origin-bottom"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setControlsOpen(false);
                      openQuickSwitcher();
                    }}
                    aria-label="Search notes"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-all duration-300 hover:bg-foreground/10 hover:text-foreground active:scale-90"
                  >
                    <Search className="h-[1.05rem] w-[1.05rem]" />
                  </button>
                  <OsModeToggle />
                  <ThemeSwitcher />
                  <ThemeToggle />
                </m.div>
              </>
            )}
          </AnimatePresence>
          <div className="glass glass-strong glass-bar glass-pill p-1">
            <button
              type="button"
              onClick={() => setControlsOpen((o) => !o)}
              aria-expanded={controlsOpen}
              aria-controls="display-controls"
              aria-label={controlsOpen ? 'Close display settings' : 'Display settings'}
              className="flex h-[2.9rem] w-[2.9rem] items-center justify-center rounded-full text-foreground/80 transition-all duration-300 hover:bg-foreground/10 hover:text-foreground active:scale-90"
            >
              {controlsOpen ? <X className="h-[1.15rem] w-[1.15rem]" /> : <Settings2 className="h-[1.15rem] w-[1.15rem]" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
