import type { Metadata, Viewport } from 'next';
import { awards } from '@/data/awards';
import { Anybody, Inter, Instrument_Serif, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { MidnightDark } from '@/components/midnight-dark';
import { ViewTransitions } from '@/components/view-transitions';
import { Navbar } from '@/components/portfolio/navbar';
import { PWARegister } from '@/components/pwa-register';
import { LiquidWallpaper } from '@/components/liquid-wallpaper';
import { BlueprintFx } from '@/components/blueprint-fx';
import { EditorialFx } from '@/components/editorial/editorial-fx';
import { Footer } from '@/components/portfolio/footer';
import { SocialRail } from '@/components/portfolio/social-rail';
import { OsModeProvider } from '@/components/os/os-mode';
import { MotionProvider } from '@/components/motion-provider';
import { QuickSwitcher } from '@/components/vault/quick-switcher';
import { HoverPreview } from '@/components/vault/hover-preview';
import { allTopics, siteUrl } from '@/lib/blog';
import { caseStudyFor } from '@/data/case-studies';
import { chunkReloadScript } from '@/lib/chunk-reload';
import { KNOWN_THEMES, getContent, getThemeSettings } from '@/lib/content';
import { ThemeOptionsProvider } from '@/components/look-toggle';
import { TrackingBeacon } from '@/components/tracking-beacon';
import { GenieLauncher } from '@/components/genie/genie-launcher';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  // About 60 characters: search results show it whole.
  title: 'Boda Madhukar Reddy — AI Architect & Senior .NET Engineer',
  description:
    // Under 160 characters, so search results show it whole.
    'Senior Software Engineer and AI architect: fast .NET APIs, self-hosted AI platforms (RAG, MCP, hybrid search) and teams of AI coding agents. Hyderabad, India.',
  alternates: {
    types: { 'application/rss+xml': [{ url: '/rss.xml', title: 'Boda Madhukar Reddy — Engineering blog' }] },
  },
  openGraph: { type: 'website', siteName: 'Boda Madhukar Reddy', locale: 'en_IN' },
  twitter: { card: 'summary_large_image' },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
    },
  },
  // Icons come from app/favicon.ico, app/icon.png and app/apple-icon.png, and the
  // manifest's from public/icons: all the same portrait on Midnight's warm black.
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    // Midnight's page colour (the default look is always dark), so the browser bar matches.
    { media: '(prefers-color-scheme: light)', color: '#110f0d' },
    { media: '(prefers-color-scheme: dark)', color: '#110f0d' },
  ],
};

// Self-hosted at build time: no render-blocking request to Google, and the files are preloaded.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
// Midnight's headlines (h1, h2 in globals.css).
// Not preloaded: only Midnight uses it, and the default look is set in the admin.
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], display: 'swap', variable: '--font-serif', preload: false });
// Terminal's headings.
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], display: 'swap', variable: '--font-grotesk' });
// Editorial's display type: a variable font whose width and weight move with the pointer.
const anybody = Anybody({ subsets: ['latin'], axes: ['wdth'], display: 'swap', variable: '--font-display', preload: false });
// Preloaded: Terminal, Blueprint and Editorial set their navigation and labels in it, above the fold.
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono' });

// The theme the site opens in, and the ones visitors can pick, are set in the admin (Themes).
// The default is rendered on <html>; before first paint this applies a visitor's own choice if that
// theme is still enabled (forgetting it otherwise), and clears accents saved by older versions.
// No data-style attribute means Midnight.
// ?look=<theme> shows a page in any known theme for that view only, without saving it (the admin's
// theme previews, Admin > Themes).
const themeScript = (enabled: string[], fallback: string) =>
  `try{localStorage.removeItem('portfolio-accent');var e=${JSON.stringify(enabled)},k=${JSON.stringify(KNOWN_THEMES)},t=${JSON.stringify(fallback)},h=document.documentElement,p=new URLSearchParams(location.search).get('look');if(p&&k.indexOf(p)>=0){t=p}else{var s=localStorage.getItem('portfolio-style');if(s&&e.indexOf(s)<0){localStorage.removeItem('portfolio-style');s=null}t=s||t}if(t==='midnight'){h.removeAttribute('data-style')}else{h.setAttribute('data-style',t)}}catch(e){}`;
// Runs after next-themes' own script, which may have set the other theme: Midnight is dark-only, Terminal light-only.
const midnightDarkScript = `try{var d=document.documentElement,s=d.getAttribute('data-style'),t=s==='terminal'||s==='editorial'||s==='arctic'||s==='dune'||s==='gazette'||s==='receipt';if(t||!s||s==='blueprint'||s==='synthwave'||s==='observatory'){d.classList.remove(t?'dark':'light');d.classList.add(t?'light':'dark');d.style.colorScheme=t?'light':'dark'}}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ profile, socialLinks, education, keyProjects, posts }, themes] = await Promise.all([getContent(), getThemeSettings()]);
  // The top bar's mega menus (components/portfolio/nav-menu.tsx).
  const menu = {
    projects: keyProjects.filter((p) => p.featured).concat(keyProjects.filter((p) => !p.featured)).slice(0, 3).map((p) => {
      const study = caseStudyFor(p.title);
      return { title: p.title, blurb: p.description, href: study ? `/projects/${study.slug}` : p.post ? `/blog/${p.post}` : '/projects' };
    }),
    posts: posts.slice(0, 3).map((p) => ({
      title: p.title,
      href: `/blog/${p.slug}`,
      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
    topics: allTopics(posts).slice(0, 8).map((t) => ({ name: t.name, href: `/topics/${t.slug}` })),
  };
  const base = siteUrl();
  // Google Knowledge Graph and entity graph linking
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${base}/#person`,
        name: profile.name,
        alternateName: ['Madhukar Reddy', 'Madhukar Reddy Boda', 'Boda Madhukar'],
        jobTitle: profile.title,
        description: profile.summary,
        url: base,
        image: `${base}/icons/icon-512.png`,
        email: `mailto:${profile.email}`,
        telephone: profile.phone,
        worksFor: {
          '@type': 'Organization',
          name: profile.company,
          url: 'https://www.revalsys.com',
        },
        alumniOf: {
          '@type': 'EducationalOrganization',
          name: education.institution,
        },
        award: awards.map((a) => `${a.body} ${a.title}, ${a.project} (${a.month})`),
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Hyderabad',
          addressRegion: 'Telangana',
          addressCountry: 'IN',
        },
        sameAs: socialLinks.map((l) => l.href),
        knowsAbout: [
          '.NET 10',
          'ASP.NET Core',
          'C#',
          'Model Context Protocol (MCP)',
          'RAG (Retrieval-Augmented Generation)',
          'Solr 9 Hybrid Search',
          'Reciprocal Rank Fusion (RRF)',
          'k6 Load Testing',
          'Grafana Observability',
          'Self-Hosted LLMs',
          'Roslyn Analyzers',
          'pgvector',
          'Next.js 16',
          'Offline-First PWA',
          'High-Throughput APIs',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        name: `${profile.name} — Senior Software Engineer & AI Architect · Engineering Blog`,
        alternateName: 'Madhukar Reddy Portfolio',
        url: base,
        description: profile.summary,
        inLanguage: 'en-IN',
        author: { '@id': `${base}/#person` },
        publisher: { '@id': `${base}/#person` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${base}/?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
  return (
    <html lang="en" data-style={themes.defaultTheme === 'midnight' ? undefined : themes.defaultTheme} className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${anybody.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(themes.enabled, themes.defaultTheme) }} />
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
          <ThemeOptionsProvider value={themes}>
          <MotionProvider>
          <OsModeProvider>
            <LiquidWallpaper />
            <BlueprintFx />
            <EditorialFx />
            <PWARegister />
            <Navbar contact={{ email: profile.email, phone: profile.phone, phoneHref: profile.phoneHref }} menu={menu} />
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
          </ThemeOptionsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
