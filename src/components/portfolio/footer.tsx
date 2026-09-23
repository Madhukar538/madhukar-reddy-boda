import Link from 'next/link';
import { Github, Linkedin, Mail, Twitter } from 'lucide-react';

const pages = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/experience', label: 'Experience' },
  { href: '/projects', label: 'Projects' },
  { href: '/lab', label: 'R&D Lab' },
  { href: '/blog', label: 'Blog' },
];

const socials = [
  { href: 'mailto:madhukarreddyboda538@gmail.com', icon: Mail, label: 'Email' },
  { href: 'https://github.com/Madhukar538', icon: Github, label: 'GitHub' },
  { href: 'https://linkedin.com/', icon: Linkedin, label: 'LinkedIn' },
  { href: 'https://twitter.com/', icon: Twitter, label: 'Twitter' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    // Bottom padding on mobile keeps the footer clear of the floating tab bar.
    <footer className="container mx-auto max-w-6xl px-4 md:px-6 pb-28 lg:pb-8">
      <div className="glass p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-1">
            <p className="text-lg font-bold text-foreground">Boda Madhukar Reddy</p>
            <p className="text-sm text-muted-foreground">Software Architect · Hyderabad, India</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
            {pages.map((p) => (
              <Link key={p.href} href={p.href} className="text-foreground/70 hover:text-primary transition-colors">
                {p.label}
              </Link>
            ))}
            <a href="/resume.pdf" download="Boda-Madhukar-Reddy-Resume.pdf" className="text-foreground/70 hover:text-primary transition-colors">
              Résumé (PDF)
            </a>
          </nav>
        </div>
        <div className="mt-6 pt-5 border-t border-foreground/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {currentYear} Boda Madhukar Reddy. All rights reserved.</p>
          <div className="flex items-center gap-1">
            {socials.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
