
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#experience', label: 'Experience' },
  { href: '#projects', label: 'Projects' },
  { href: '#research', label: 'R&D' },
  { href: '#education', label: 'Education' },
];

export function Header() {
  const [activeSection, setActiveSection] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const sections = navLinks.map((link) => document.querySelector(link.href));
    const hero = document.querySelector('#home');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );

    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShowProfile(!entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );

    sections.forEach((section) => {
      if (section) observer.observe(section);
    });
    if (hero) heroObserver.observe(hero);

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
      if (hero) heroObserver.unobserve(hero);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-accent/15 via-transparent to-primary/10" />
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6 relative">
        <div className="flex items-center gap-3 min-w-[150px]" aria-hidden />

        <nav className="hidden md:flex flex-1 justify-center items-center gap-3 text-sm">
          {navLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                'rounded-full px-3 py-2 transition-all duration-200 hover:text-accent',
                href === `#${activeSection}`
                  ? 'bg-accent/10 text-primary font-semibold shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="hidden md:flex items-center gap-3 rounded-full border border-border/60 bg-background/80 px-3 py-2 shadow-sm"
              >
                <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-accent/30 shadow-sm">
                  <Image
                    src="/madhukar.png"
                    alt="Boda Madhukar Reddy"
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-primary">Boda Madhukar Reddy</p>
                  <p className="text-xs text-muted-foreground">Software Architect · Hyderabad, IN</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ThemeToggle />
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[360px]">
                <nav className="flex flex-col gap-3 pt-8">
                  {navLinks.map(({ href, label }) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setIsSheetOpen(false)}
                      className={cn(
                        'rounded-lg px-3 py-2 text-lg transition-colors hover:text-accent',
                        href === `#${activeSection}`
                          ? 'bg-accent/10 text-primary font-semibold'
                          : 'text-muted-foreground'
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
