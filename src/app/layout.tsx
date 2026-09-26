import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/portfolio/navbar';
import { PWARegister } from '@/components/pwa-register';
import { LiquidWallpaper } from '@/components/liquid-wallpaper';
import { Footer } from '@/components/portfolio/footer';
import { OsModeProvider } from '@/components/os/os-mode';
import { MotionProvider } from '@/components/motion-provider';
import { QuickSwitcher } from '@/components/vault/quick-switcher';
import { HoverPreview } from '@/components/vault/hover-preview';
import { siteUrl } from '@/lib/blog';
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
  // The favicon comes from app/icon.png (64px); the full photo is only for home-screen icons.
  icons: {
    apple: '/madhukar.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f2f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0c' },
  ],
};

// Self-hosted at build time: no render-blocking request to Google, and the files are preloaded.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
// Code blocks only, so it isn't preloaded on every page.
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono', preload: false });

// Applies the saved accent tint before first paint to avoid a color flash.
const accentScript = `try{var a=localStorage.getItem('portfolio-accent');if(a&&a!=='blue')document.documentElement.setAttribute('data-accent',a)}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile, socialLinks } = await getContent();
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentScript }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
          <OsModeProvider>
            <LiquidWallpaper />
            <PWARegister />
            <Navbar />
            <main className="relative z-0 min-h-[70dvh]">
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
