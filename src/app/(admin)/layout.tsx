import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { siteUrl } from '@/lib/blog';

/**
 * The admin's own root layout: an app, not a page of the site. None of the site's chrome (its nav,
 * rails, footer, chat or effects) and none of its looks: one calm style that follows the system's
 * light or dark setting, whatever look a visitor last picked. Its shell is components/admin/admin-shell.
 * The URL is still /admin; route groups don't change it.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'Admin — dhucar.in',
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f4' },
    { media: '(prefers-color-scheme: dark)', color: '#111113' },
  ],
};

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono' });

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-admin="" data-style="admin" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
