'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpenText,
  Bug,
  ExternalLink,
  FileText,
  Files,
  FolderKanban,
  Globe2,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Palette,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPlatformHost } from '@/lib/admin/api';
import { useAdmin } from './session';
import { Notice, Spinner, secondaryButton } from './ui';
import { RefreshSiteButton } from './refresh-site';

type NavItem = { href: string; label: string; icon: typeof BarChart3 };

/** The admin's sections, grouped the way the work is: what's on the site, what came in, how it runs. */
const GROUPS: { label: string; items: NavItem[] }[] = [
  { label: '', items: [{ href: '/admin', label: 'Dashboard', icon: BarChart3 }] },
  {
    label: 'Content',
    items: [
      { href: '/admin/posts', label: 'Posts', icon: FileText },
      { href: '/admin/pages', label: 'Pages', icon: Files },
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { href: '/admin/story', label: 'Story', icon: BookOpenText },
      { href: '/admin/profile', label: 'Profile', icon: UserRound },
      { href: '/admin/bug-log', label: 'Bug log', icon: Bug },
    ],
  },
  {
    label: 'Inbox',
    items: [
      { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
      { href: '/admin/tickets', label: 'Tickets', icon: LifeBuoy },
      { href: '/admin/errors', label: 'Errors', icon: TriangleAlert },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/themes', label: 'Themes', icon: Palette },
      { href: '/admin/sites', label: 'Sites', icon: Globe2 },
      { href: '/admin/security', label: 'Security', icon: ShieldCheck },
    ],
  },
];

/**
 * What another site's admin has: no tickets, bug log or browser errors (they belong to this site's
 * Fix a bug and visitors), no pages (only this site serves them), themes or sites.
 */
const PLATFORM_ONLY = ['/admin/tickets', '/admin/pages', '/admin/errors', '/admin/bug-log', '/admin/themes', '/admin/sites'];

function SideNav({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const { email, signOut } = useAdmin();
  // Only rendered once signed in (client-side), so reading the host here can't mismatch the server.
  const isPlatform = isPlatformHost();
  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5 px-3 pb-5 pt-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">d</span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">Admin</span>
          <span className="block text-xs text-muted-foreground">{typeof window === 'undefined' ? '' : window.location.hostname}</span>
        </span>
      </Link>
      <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto">
        {GROUPS.map((group) => {
          const items = group.items.filter((item) => isPlatform || !PLATFORM_ONLY.includes(item.href));
          if (items.length === 0) return null;
          return (
            <div key={group.label || 'top'}>
              {group.label && <p className="mb-1.5 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{group.label}</p>}
              <ul className="space-y-0.5">
                {items.map(({ href, label, icon: Icon }) => {
                  const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive ? 'bg-primary/10 text-primary' : 'text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-foreground/10 pt-4">
        <p className="truncate px-3 text-xs text-muted-foreground" title={email}>{email}</p>
        <button type="button" onClick={() => void signOut()} className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-foreground/[0.06] hover:text-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

/**
 * Frame for every signed-in admin page: a grouped side menu (a drawer on phones), and a top bar
 * with the page's title and actions, a link to the site and the cache refresh. Sends signed-out
 * visitors to the sign-in page.
 */
export function AdminShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const { status, error, retry } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'signed-out') router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  // The drawer closes on any navigation and with Escape.
  useEffect(() => setIsMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  if (status === 'unavailable') {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16">
        <Notice>Couldn&apos;t check your session: {error}</Notice>
        <button type="button" onClick={retry} className={secondaryButton}>
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }
  if (status !== 'signed-in') {
    return (
      <div className="px-4 py-16">
        <Spinner label={status === 'loading' ? 'Checking your session' : 'Redirecting to sign in'} />
      </div>
    );
  }

  return (
    <div className="admin-app lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      {/* Desktop: a sticky side menu. */}
      <aside className="admin-side hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-foreground/10 lg:px-3 lg:py-5">
        <SideNav pathname={pathname} onNavigate={() => {}} />
      </aside>

      {/* Phones and tablets: the same menu as a drawer. */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close the menu" onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="admin-side absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-foreground/10 bg-background px-3 py-5 shadow-xl">
            <button type="button" onClick={() => setIsMenuOpen(false)} aria-label="Close the menu" className="absolute right-3 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/[0.06]">
              <X className="h-5 w-5" />
            </button>
            <SideNav pathname={pathname} onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="admin-top sticky top-0 z-40 flex items-center gap-3 border-b border-foreground/10 px-4 py-3 md:px-8">
          <button type="button" onClick={() => setIsMenuOpen(true)} aria-label="Open the menu" className="-ml-1 rounded-lg p-1.5 text-foreground/80 hover:bg-foreground/[0.06] lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
          {/* The page's own actions (New post, All pages...) sit here on wider screens. */}
          {actions && <div className="admin-actions hidden items-center gap-2 md:flex">{actions}</div>}
          <div className="flex items-center gap-1.5">
            {isPlatformHost() && <RefreshSiteButton />}
            <a href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">View site</span>
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {actions && <div className="admin-actions mb-5 flex flex-wrap justify-end gap-2 md:hidden">{actions}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
