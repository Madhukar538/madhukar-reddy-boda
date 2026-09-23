'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, User, FlaskConical, PenLine, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { motion } from 'framer-motion';
import { LiquidLens } from '@/components/liquid-lens';
import { OsModeToggle } from '@/components/os/os-mode';

// Every page on the site — each one is its own URL.
export const navLinks = [
  { href: '/',           label: 'Home',       icon: Home },
  { href: '/about',      label: 'About',      icon: User },
  { href: '/experience', label: 'Experience', icon: Briefcase },
  { href: '/projects',   label: 'Projects',   icon: FolderKanban },
  { href: '/lab',        label: 'Lab',        icon: FlaskConical },
  { href: '/blog',       label: 'Blog',       icon: PenLine },
];

// Mobile tab bar — capped to 5 so it fits a 320px screen.
// The Lab is reachable from Home and the Projects page.
const tabLinks = [
  { href: '/',           label: 'Home',    icon: Home },
  { href: '/about',      label: 'About',   icon: User },
  { href: '/experience', label: 'Career',  icon: Briefcase },
  { href: '/projects',   label: 'Work',    icon: FolderKanban },
  { href: '/blog',       label: 'Blog',    icon: PenLine },
];

export function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (href === '/projects') return pathname.startsWith('/projects') || pathname.startsWith('/lab');
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ── Desktop floating glass capsule ── */}
      <header className="hidden lg:flex fixed top-4 inset-x-0 z-[100] justify-center px-6 pointer-events-none">
        <div
          className={cn(
            'glass glass-strong glass-pill pointer-events-auto flex items-center gap-2 px-2 py-1.5 transition-shadow duration-500',
            scrolled && 'shadow-2xl'
          )}
        >
          <LiquidLens />
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-sm font-semibold text-foreground hover:bg-foreground/5 transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
              MR
            </span>
            Madhukar
          </Link>

          <div className="h-5 w-px bg-foreground/10" />

          <nav className="flex items-center gap-0.5" aria-label="Main">
            {navLinks.slice(1).map((link) => {
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
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-foreground/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_0.5px_rgba(255,255,255,0.15)]"
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
            <OsModeToggle />
            <ThemeSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Mobile / tablet floating tab bar ── */}
      <div className="lg:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-0 z-[100] flex items-end justify-center gap-1.5 min-[360px]:gap-2 px-2 pointer-events-none">
        <nav className="glass glass-strong glass-pill pointer-events-auto flex items-center p-1" aria-label="Main">
          <LiquidLens strength={32} />
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
                  <motion.span
                    layoutId="mobile-pill"
                    className="absolute inset-0 rounded-full bg-foreground/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative h-[1.15rem] w-[1.15rem]" strokeWidth={isActive ? 2.4 : 2} />
                <span className="relative text-[10px] font-medium mt-0.5">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Detached control cluster, like iOS 26's separate tab-bar button */}
        <div className="glass glass-strong glass-pill pointer-events-auto flex flex-col items-center p-1">
          <LiquidLens strength={28} />
          <OsModeToggle />
          <ThemeSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
