'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, BookText, User, GraduationCap, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';

export const navLinks = [
  { href: '/#home',     label: 'home',     icon: Home,          sectionId: 'home'     },
  { href: '/#about',    label: 'about',    icon: User,          sectionId: 'about'    },
  { href: '/#skills',   label: 'skills',   icon: GraduationCap, sectionId: 'skills'   },
  { href: '/#projects', label: 'projects', icon: Briefcase,     sectionId: 'projects' },
  { href: '/#insights', label: 'blog',     icon: BookText,      sectionId: 'insights' },
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
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      for (const link of navLinks) {
        const el = document.getElementById(link.sectionId);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top && scrollPosition < top + el.offsetHeight) {
            setActiveSection(link.sectionId);
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  return (
    <>
      {/* ── Desktop top bar ── */}
      <header
        className={cn(
          'hidden md:flex fixed top-0 left-0 right-0 z-[100] h-14 items-center justify-between px-6',
          'border-b transition-all duration-300',
          scrolled
            ? 'bg-background/95 backdrop-blur-md border-border'
            : 'bg-transparent border-transparent'
        )}
      >
        {/* Left: terminal prompt brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-semibold group"
        >
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">~/</span>
          <span className="text-primary">madhukar</span>
          <span className="text-muted-foreground"> ~</span>
          <span className="animate-pulse text-primary ml-0.5">▋</span>
        </Link>

        {/* Center: nav links as bracket buttons */}
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
                  isActive
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground'
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

        {/* Right: theme toggle */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground hidden lg:block">
            v1.0.0
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Mobile floating bottom dock ── */}
      <nav className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] w-auto">
        <div className="flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-sm shadow-lg">
          {navLinks.map((link) => {
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
                  'relative flex flex-col items-center justify-center p-2.5 rounded-sm transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {isActive && (
                  <motion.div
                    layoutId="mobile-dot"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          <div className="w-px h-5 bg-border mx-1" />
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
