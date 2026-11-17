import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Anybody, Inter, JetBrains_Mono } from 'next/font/google';
import '../../../globals.css';
import { EditorialFx } from '@/components/editorial/editorial-fx';
import { getSiteContent, siteHost } from '@/lib/site-content';

/**
 * Another site on the platform, served on its own domain: proxy.ts rewrites asha.example.com/about
 * to /sites/asha.example.com/about. Its own root layout, so nothing of this site (its nav, footer,
 * name, analytics or chat) appears there. Editorial only, on paper, with the site's own name.
 */

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const anybody = Anybody({ subsets: ['latin'], axes: ['wdth'], display: 'swap', variable: '--font-display', preload: false });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono' });

type Props = { children: React.ReactNode; params: Promise<{ site: string }> };

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f1efea' };

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const host = siteHost((await params).site);
  const content = host ? await getSiteContent(host) : null;
  if (!host || !content) return { title: 'Not found', robots: { index: false } };
  return {
    metadataBase: new URL(`https://${host}`),
    title: { default: `${content.profile.name} — ${content.profile.title}`, template: `%s — ${content.profile.name}` },
    description: content.profile.summary.slice(0, 160),
    openGraph: { type: 'website', siteName: content.profile.name },
  };
}

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/experience', label: 'Experience' },
  { href: '/about', label: 'About' },
];

export default async function SiteLayout({ children, params }: Props) {
  const host = siteHost((await params).site);
  const content = host ? await getSiteContent(host) : null;
  return (
    <html lang="en" data-style="editorial" className={`light ${inter.variable} ${anybody.variable} ${jetbrainsMono.variable}`} style={{ colorScheme: 'light' }}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <EditorialFx />
        {content && (
          <header className="site-nav">
            <Link href="/" className="site-nav-name">
              {content.profile.name}
            </Link>
            <nav aria-label="Main">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
        )}
        <main className="relative z-0 min-h-[70dvh]">{children}</main>
        {content && (
          <footer className="site-footer">
            <span>
              © {new Date().getFullYear()} {content.profile.name}
            </span>
            {content.profile.location && <span>{content.profile.location}</span>}
          </footer>
        )}
      </body>
    </html>
  );
}
