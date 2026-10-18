import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { MidnightDark } from '@/components/midnight-dark';
import { ViewTransitions } from '@/components/view-transitions';
import { Navbar } from '@/components/portfolio/navbar';
import { PWARegister } from '@/components/pwa-register';
import { LiquidWallpaper } from '@/components/liquid-wallpaper';
import { Footer } from '@/components/portfolio/footer';
import { SocialRail } from '@/components/portfolio/social-rail';
import { OsModeProvider } from '@/components/os/os-mode';
import { MotionProvider } from '@/components/motion-provider';
import { QuickSwitcher } from '@/components/vault/quick-switcher';
import { HoverPreview } from '@/components/vault/hover-preview';
import { siteUrl } from '@/lib/blog';
import { chunkReloadScript } from '@/lib/chunk-reload';
import { getContent } from '@/lib/content';
import { TrackingBeacon } from '@/components/tracking-beacon';
import { GenieLauncher } from '@/components/genie/genie-launcher';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'Boda Madhukar Reddy — Software Architect & Tech Blogger',
  description:
    'Software Architect specializing in .NET, high-throughput APIs, self-hosted AI platforms (RAG, MCP, hybrid search) and k6 performance engineering. Architecture deep-dives and engineering blog.',
  alternates: {
    types: { 'application/rss+xml': [{ url: '/rss.xml', title: 'Boda Madhukar Reddy — Engineering blog' }] },
  },
  openGraph: { type: 'website', siteName: 'Boda Madhukar Reddy', locale: 'en_IN' },
  twitter: { card: 'summary_large_image' },
  // Icons come from app/favicon.ico, app/icon.png and app/apple-icon.png, and the
  // manifest's from public/icons: all the same portrait on the Midnight navy.
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    // Midnight's page colour (the default look is always dark), so the browser bar matches.
    { media: '(prefers-color-scheme: light)', color: '#070a12' },
    { media: '(prefers-color-scheme: dark)', color: '#070a12' },
  ],
};

// Self-hosted at build time: no render-blocking request to Google, and the files are preloaded.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
// Code blocks only, so it isn't preloaded on every page.
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono', preload: false });

// Applies the saved accent tint and look before first paint, so neither flashes.
// Midnight (no data-style) is the default look and is always dark; Graphite is the default accent.
const accentScript = `try{var d=document.documentElement,a=localStorage.getItem('portfolio-accent')||'graphite',s=localStorage.getItem('portfolio-style');if(a!=='blue')d.setAttribute('data-accent',a);if(s==='glass')d.setAttribute('data-style','glass')}catch(e){}`;
// Runs after next-themes' own script, which may have set a light theme.
const midnightDarkScript = `try{var d=document.documentElement;if(!d.hasAttribute('data-style')){d.classList.remove('light');d.classList.add('dark');d.style.colorScheme='dark'}}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile, socialLinks } = await getContent();
  const base = siteUrl();
  // Who the site is about, for search engines: the same portrait as the icons.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${base}/#person`,
        name: profile.name,
        jobTitle: profile.title,
        url: base,
        image: `${base}/icons/icon-512.png`,
        sameAs: socialLinks.map((l) => l.href),
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        name: 'Boda Madhukar Reddy',
        url: base,
        author: { '@id': `${base}/#person` },
      },
    ],
  };
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentScript }} />
        <script dangerouslySetInnerHTML={{ __html: chunkReloadScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <script dangerouslySetInnerHTML={{ __html: midnightDarkScript }} />
          <MidnightDark />
          <ViewTransitions />
          <MotionProvider>
          <OsModeProvider>
            <LiquidWallpaper />
            <PWARegister />
            <Navbar />
            <main className="relative z-0 min-h-[70dvh]">
              <SocialRail profile={profile} socialLinks={socialLinks} />
              {children}
            </main>
            <Footer profile={profile} socialLinks={socialLinks} />
            <Toaster />
            <QuickSwitcher />
            <HoverPreview />
            <TrackingBeacon />
            <GenieLauncher email={profile.email} />
          </OsModeProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
