'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, BookText, User, GraduationCap, FlaskConical, Layers, PenLine, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { motion } from 'framer-motion';

// All sections — used by desktop sidebar nav and scroll spy
export const navLinks = [
  { href: '/#home',       label: 'Home',       icon: Home,          sectionId: 'home'       },
  { href: '/#about',      label: 'About',      icon: User,          sectionId: 'about'      },
  { href: '/#skills',     label: 'Skills',     icon: Layers,        sectionId: 'skills'     },
  { href: '/#experience', label: 'Experience', icon: Briefcase,     sectionId: 'experience' },
  { href: '/#projects',   label: 'Work',       icon: FolderKanban,     sectionId: 'projects'   },
  { href: '/#research',   label: 'Lab',        icon: FlaskConical,  sectionId: 'research'   },
  { href: '/#education',  label: 'Education',  icon: GraduationCap, sectionId: 'education'  },
  { href: '/#insights',   label: 'Blog',       icon: PenLine,       sectionId: 'insights'   },
];

// Mobile tab bar — capped to 5 key sections to fit any phone screen
const dockLinks = [
  { href: '/#home',       label: 'Home',   icon: Home,      sectionId: 'home'       },
  { href: '/#skills',     label: 'Skills', icon: Layers,    sectionId: 'skills'     },
  { href: '/#experience', label: 'Career', icon: Briefcase, sectionId: 'experience' },
  { href: '/#projects',   label: 'Work',   icon: FolderKanban, sectionId: 'projects'   },
  { href: '/#insights',   label: 'Blog',   icon: PenLine,   sectionId: 'insights'   },
];

export function Navbar() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScrolled = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScrolled);
    return () => window.removeEventListener('scroll', handleScrolled);
  }, []);

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection(pathname.startsWith('/blog') ? 'insights' : '');
      return;
    }

    const sectionIds = navLinks.map((l) => l.sectionId).filter(Boolean) as string[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: '-10% 0px -50% 0px',
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    // querySelectorAll: #home exists twice (desktop sidebar + mobile hero)
    sectionIds.forEach((id) => {
      document.querySelectorAll(`[id="${id}"]`).forEach((el) => observer.observe(el));
    });

    return () => observer.disconnect();
  }, [pathname]);

  const isLinkActive = (sectionId: string) =>
    sectionId === 'insights'
      ? pathname.startsWith('/blog') || activeSection === 'insights'
      : pathname === '/' && activeSection === sectionId;

  return (
    <>
      {/* ── Desktop floating glass capsule ── */}
      <header className="hidden lg:flex fixed top-4 inset-x-0 z-[100] justify-center px-6 pointer-events-none">
        <div
          className={cn(
            'glass glass-strong glass-pill pointer-events-auto flex items-center gap-2 pl-2 pr-2 py-1.5 transition-all duration-500',
            scrolled ? 'shadow-2xl' : ''
          )}
        >
          {/* Brand */}
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

          {/* Links */}
          <nav className="flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.sectionId);
              return (
                <Link
                  key={link.label}
                  href={link.href}
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

          {/* Appearance controls */}
          <div className="flex items-center">
            <ThemeSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Mobile / tablet floating tab bar ── */}
      <div className="lg:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-0 z-[100] flex items-end justify-center gap-1.5 min-[360px]:gap-2 px-2 pointer-events-none">
        <nav className="glass glass-strong glass-pill pointer-events-auto flex items-center p-1">
          {dockLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isLinkActive(link.sectionId);
            return (
              <Link
                key={link.label}
                href={link.href}
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

        {/* Separate circular control cluster, like iOS 26's detached tab-bar button */}
        <div className="glass glass-strong glass-pill pointer-events-auto flex flex-col items-center p-1">
          <ThemeSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
