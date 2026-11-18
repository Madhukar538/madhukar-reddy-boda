import Link from 'next/link';
import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';
import type { Profile, SocialLink } from '@/lib/content';
import { BuildStamp } from '@/components/portfolio/build-stamp';
import { AwardBadge } from '@/components/portfolio/award-badge';
import { awards } from '@/data/awards';

const pages = [
  { href: '/', label: 'Blog' },
  { href: '/topics', label: 'Topics' },
  { href: '/about', label: 'About' },
  { href: '/experience', label: 'Experience' },
  { href: '/projects', label: 'Projects' },
  { href: '/lab', label: 'R&D Lab' },
  { href: '/ai', label: 'AI / MCP' },
  { href: '/graph', label: 'Graph' },
  { href: '/work-with-me', label: 'Work with me' },
  { href: '/fix-a-bug', label: 'Fix a bug' },
  { href: '/status', label: 'Status' },
  { href: '/sitemap', label: 'Sitemap' },
];

const icons = { GitHub: Github, LinkedIn: Linkedin };

export function Footer({ profile, socialLinks, bugsFixed = 0 }: { profile: Profile; socialLinks: SocialLink[]; bugsFixed?: number }) {
  const socials = [
    { href: `mailto:${profile.email}`, icon: Mail, label: 'Email' },
    ...socialLinks.map(({ network, href }) => ({ href, icon: icons[network], label: network })),
  ];
  const currentYear = new Date().getFullYear();
  return (
    // Bottom padding on mobile keeps the footer clear of the floating tab bar.
    <footer className="container mx-auto max-w-6xl px-4 md:px-6 pb-28 lg:pb-10">
      {/* Editorial's closing line (globals.css shows it only in that look). */}
      <section className="ed-cta" aria-labelledby="ed-cta-title">
        <p className="ed-cta-kicker">( What&apos;s next )</p>
        <Link href="/fix-a-bug" className="ed-cta-link">
          <span id="ed-cta-title" className="ed-cta-big">
            <span>Stuck on a bug?</span>
            <span>Let&apos;s fix it fast</span>
          </span>
          <span className="ed-cta-go" aria-hidden>
            <ArrowUpRight />
          </span>
        </Link>
        <div className="ed-cta-row">
          <a href={`mailto:${profile.email}`} className="ed-link">
            {profile.email}
          </a>
          <span>Hyderabad, India · IST</span>
          <Link href="/fix-a-bug" className="ed-link">
            Send a bug report
          </Link>
        </div>
      </section>
      <div className="border-t border-foreground/10 pt-8 md:pt-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xl font-bold tracking-tight text-foreground">Boda Madhukar Reddy</p>
            <p className="text-sm text-muted-foreground">Senior Software Engineer · AI Architect · Hyderabad, India</p>
            {awards.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3">
                {awards.map((award) => (
                  <AwardBadge key={award.url} award={award} />
                ))}
              </div>
            )}
          </div>
          <nav aria-label="Footer" className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
            {(bugsFixed > 0 ? pages.flatMap((p) => (p.href === '/fix-a-bug' ? [p, { href: '/bug-log', label: 'Bug log' }] : [p])) : pages).map((p) => (
              <Link key={p.href} href={p.href} className="tap text-foreground/70 hover:text-primary transition-colors">
                {p.label}
              </Link>
            ))}
            <a href="/resume.pdf" download="Boda-Madhukar-Reddy-Resume.pdf" className="tap text-foreground/70 hover:text-primary transition-colors">
              Résumé (PDF)
            </a>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-foreground/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-xs text-muted-foreground">© {currentYear} Boda Madhukar Reddy. All rights reserved.</p>
            <BuildStamp />
          </div>
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
