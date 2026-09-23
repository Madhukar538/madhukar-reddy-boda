import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/portfolio/navbar';
import { PWARegister } from '@/components/pwa-register';
import { LiquidWallpaper } from '@/components/liquid-wallpaper';
import { Footer } from '@/components/portfolio/footer';
import { OsModeProvider } from '@/components/os/os-mode';

export const metadata: Metadata = {
  title: 'Boda Madhukar Reddy — Software Architect & Tech Blogger',
  description:
    'Software Architect specializing in .NET, high-throughput APIs, self-hosted AI platforms (RAG, MCP, hybrid search) and k6 performance engineering. Architecture deep-dives and engineering blog.',
  icons: {
    icon: '/madhukar.png',
    shortcut: '/madhukar.png',
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

// Applies the saved accent tint before first paint to avoid a color flash.
const accentScript = `try{var a=localStorage.getItem('portfolio-accent');if(a&&a!=='blue')document.documentElement.setAttribute('data-accent',a)}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: accentScript }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <OsModeProvider>
            <LiquidWallpaper />
            <PWARegister />
            <Navbar />
            <main className="relative z-0 min-h-[70dvh]">
              {children}
            </main>
            <Footer />
            <Toaster />
          </OsModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
