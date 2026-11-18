'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, FileText, FolderKanban, LifeBuoy, LogOut, MessageSquare, Palette, RefreshCw, ShieldCheck, UserRound, BookOpenText, Globe2, Bug, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPlatformHost } from '@/lib/admin/api';
import { useAdmin } from './session';
import { Notice, Spinner, secondaryButton } from './ui';

const NAV = [
  { href: '/admin', label: 'Traffic', icon: BarChart3 },
  { href: '/admin/posts', label: 'Posts', icon: FileText },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
  { href: '/admin/tickets', label: 'Tickets', icon: LifeBuoy },
  { href: '/admin/errors', label: 'Errors', icon: TriangleAlert },
  { href: '/admin/profile', label: 'Profile', icon: UserRound },
  { href: '/admin/story', label: 'Story', icon: BookOpenText },
  { href: '/admin/bug-log', label: 'Bug log', icon: Bug },
  { href: '/admin/themes', label: 'Themes', icon: Palette },
  { href: '/admin/sites', label: 'Sites', icon: Globe2 },
  { href: '/admin/security', label: 'Security', icon: ShieldCheck },
];

/** What another site's admin has: no tickets or bug log (they belong to this site's Fix a bug), browser errors (only this site reports them), themes or sites. */
const PLATFORM_ONLY = ['/admin/tickets', '/admin/errors', '/admin/bug-log', '/admin/themes', '/admin/sites'];

/** Frame for every signed-in admin page: sends signed-out visitors to the sign-in page. */
export function AdminShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const { status, error, retry, email, signOut } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'signed-out') router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status === 'unavailable') {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10">
        <Notice>Couldn&apos;t check your session: {error}</Notice>
        <button type="button" onClick={retry} className={secondaryButton}>
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }
  if (status !== 'signed-in') return <Spinner label={status === 'loading' ? 'Checking your session' : 'Redirecting to sign in'} />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Admin" className="glass glass-pill flex max-w-full gap-1 overflow-x-auto p-1">
          {/* Only rendered once signed in (client-side), so reading the host here can't mismatch the server. */}
          {NAV.filter((item) => isPlatformHost() || !PLATFORM_ONLY.includes(item.href)).map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:bg-foreground/10 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{email}</span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="glass glass-pill glass-interactive inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
