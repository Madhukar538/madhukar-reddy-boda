'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, BookText, User, GraduationCap, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { motion } from 'framer-motion';

// All sections — used by desktop sidebar nav and scroll spy
export const navLinks = [
  { href: '/#home',       label: 'home',       icon: Home,          sectionId: 'home'       },
  { href: '/#about',      label: 'about',      icon: User,          sectionId: 'about'      },
  { href: '/#skills',     label: 'skills',     icon: GraduationCap, sectionId: 'skills'     },
  { href: '/#experience', label: 'experience', icon: Briefcase,     sectionId: 'experience' },
  { href: '/#projects',   label: 'projects',   icon: Briefcase,     sectionId: 'projects'   },
  { href: '/#research',   label: 'research',   icon: BookText,      sectionId: 'research'   },
  { href: '/#education',  label: 'edu',        icon: GraduationCap, sectionId: 'education'  },
  { href: '/#insights',   label: 'blog',       icon: BookText,      sectionId: 'insights'   },
];

// Mobile bottom dock — capped to 5 key sections to fit any phone screen
const dockLinks = [
  { href: '/#home',       label: 'home',  icon: Home,          sectionId: 'home'       },
  { href: '/#skills',     label: 'skills',icon: GraduationCap, sectionId: 'skills'     },
  { href: '/#experience', label: 'exp',   icon: Briefcase,     sectionId: 'experience' },
  { href: '/#projects',   label: 'work',  icon: Briefcase,     sectionId: 'projects'   },
  { href: '/#insights',   label: 'blog',  icon: BookText,      sectionId: 'insights'   },
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

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return (
    <>
      {/* ── Desktop top bar ── */}
      <header
        className={cn(
          'hidden md:flex fixed top-0 left-0 right-0 z-[100] h-14 items-center justify-between px-6',
          'border-b transition-all duration-300',
          scrolled
            ? 'bg-card/60 backdrop-blur-xl border-border/50 shadow-lg shadow-black/10'
            : 'bg-transparent border-transparent'
        )}
      >
        {/* Left: terminal prompt brand */}
        <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold group">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">~/</span>
          <span className="text-primary">madhukar</span>
          <span className="text-muted-foreground"> ~</span>
          <span className="animate-pulse text-primary ml-0.5">▋</span>
        </Link>

        {/* Center: nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.sectionId === 'insights'
                ? pathname.startsWith('/blog') || activeSection === 'insights'
                : pathname === '/' && activeSection === link.sectionId;

            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  'relative px-3 py-1.5 text-xs font-mono font-medium transition-all duration-200 rounded-sm',
                  'hover:text-primary hover:bg-primary/5',
                  isActive ? 'text-primary bg-primary/8' : 'text-muted-foreground'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 border border-primary/40 rounded-sm bg-primary/5"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative">[{link.label}]</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: theme toggle & switcher */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground hidden lg:block mr-1">v1.0.0</span>
          <ThemeSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* ── Mobile floating bottom dock (5 items max) ── */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]">
        <div className="flex items-center bg-card/60 backdrop-blur-xl border border-border/50 rounded-sm shadow-xl shadow-black/20 px-1 py-1">
          {dockLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.sectionId === 'insights'
                ? pathname.startsWith('/blog') || activeSection === 'insights'
                : pathname === '/' && activeSection === link.sectionId;

            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  'relative flex flex-col items-center justify-center px-3 py-2 rounded-sm transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className={cn(
                  'text-[9px] mt-0.5 font-mono',
                  isActive ? 'text-primary' : 'text-muted-foreground/60'
                )}>
                  {link.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-dot"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          <div className="w-px h-5 bg-border/60 mx-1.5 shrink-0" />
          <div className="px-1.5 shrink-0">
            <ThemeSwitcher />
          </div>
        </div>
      </nav>
    </>
  );
}
