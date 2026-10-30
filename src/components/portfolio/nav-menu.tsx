'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ArrowUpRight, ChevronDown, Rss } from 'lucide-react';
import { cn } from '@/lib/utils';

/** What the mega menus show; built on the server in app/layout. */
export type NavMenuData = {
  projects: { title: string; blurb: string; href: string }[];
  posts: { title: string; href: string; date: string }[];
  topics: { name: string; href: string }[];
};

type MenuId = 'work' | 'writing';

/** A mono kicker over each column, like the labels in the backdrop diagram. */
function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 font-mono text-[0.7rem] text-muted-foreground">{children}</p>;
}

function WorkPanel({ data }: { data: NavMenuData }) {
  return (
    <div className="grid grid-cols-[1.6fr_1fr]">
      <div className="p-6">
        <Kicker>selected projects</Kicker>
        <ul className="space-y-1">
          {data.projects.map((p) => (
            <li key={p.href + p.title}>
              <Link href={p.href} className="group -mx-3 block rounded-md px-3 py-2.5 transition-colors hover:bg-foreground/[0.04]">
                <span className="flex items-center gap-1.5 text-[0.95rem] font-medium text-foreground group-hover:text-primary transition-colors">
                  {p.title}
                  <ArrowUpRight aria-hidden className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{p.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/projects" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors">
          All projects <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex flex-col border-l border-foreground/10 p-6">
        <Kicker>more</Kicker>
        <ul className="space-y-3 text-sm">
          {[
            { href: '/lab', label: 'R&D lab', note: 'Experiments and prototypes' },
            { href: '/experience', label: 'Experience', note: 'Where I have worked' },
            { href: '/graph', label: 'Knowledge graph', note: 'How it all connects' },
          ].map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="group block">
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">{l.label}</span>
                <span className="block text-muted-foreground">{l.note}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto border-t border-foreground/10 pt-4">
          <p className="font-mono text-[0.7rem] text-muted-foreground">
            status: <span className="text-primary">open to work</span>
          </p>
          <Link href="/work-with-me" className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors">
            Start a project <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function WritingPanel({ data }: { data: NavMenuData }) {
  return (
    <div className="grid grid-cols-[1.6fr_1fr]">
      <div className="p-6">
        <Kicker>latest posts</Kicker>
        <ul className="space-y-1">
          {data.posts.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="group -mx-3 flex items-baseline justify-between gap-4 rounded-md px-3 py-2.5 transition-colors hover:bg-foreground/[0.04]">
                <span className="line-clamp-1 text-[0.95rem] font-medium text-foreground group-hover:text-primary transition-colors">{p.title}</span>
                <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground">{p.date}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/#posts-heading" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors">
          All writing <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex flex-col border-l border-foreground/10 p-6">
        <Kicker>topics</Kicker>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {data.topics.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="text-foreground/80 underline decoration-foreground/20 underline-offset-4 hover:text-primary hover:decoration-primary transition-colors">
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center gap-5 border-t border-foreground/10 pt-4 text-sm">
          <Link href="/topics" className="font-medium text-foreground hover:text-primary transition-colors">All topics</Link>
          <a href="/rss.xml" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Rss aria-hidden className="h-3.5 w-3.5" /> RSS
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * The top bar's two mega menus, Work and Writing: open on hover or click, close
 * on leaving, Escape, a click elsewhere, or navigating. The panel hangs below the
 * capsule (outside it, since the capsule clips its own content).
 */
export function useMegaMenu(disabled: boolean) {
  const [open, setOpen] = useState<MenuId | null>(null);
  const closeTimer = useRef(0);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(null), []);
  const show = useCallback((id: MenuId) => {
    window.clearTimeout(closeTimer.current);
    setOpen(id);
  }, []);
  const hideSoon = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(null), 160);
  }, []);
  const keep = useCallback(() => window.clearTimeout(closeTimer.current), []);

  useEffect(() => close(), [pathname, disabled, close]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-mega-root]')) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, close]);

  return { open, setOpen, show, hideSoon, keep };
}

export function MegaTrigger({
  id,
  label,
  active,
  menu,
}: {
  id: MenuId;
  label: string;
  active: boolean;
  menu: ReturnType<typeof useMegaMenu>;
}) {
  const isOpen = menu.open === id;
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={`mega-${id}`}
      onClick={() => menu.setOpen(isOpen ? null : id)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && menu.show(id)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && menu.hideSoon()}
      className={cn('nav-link inline-flex items-center gap-1', (active || isOpen) && 'text-foreground')}
      data-active={active ? '' : undefined}
    >
      {label}
      <ChevronDown aria-hidden className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-180')} />
    </button>
  );
}

export function MegaPanel({ data, menu }: { data: NavMenuData; menu: ReturnType<typeof useMegaMenu> }) {
  if (!menu.open) return null;
  return (
    <div
      id={`mega-${menu.open}`}
      onPointerEnter={menu.keep}
      onPointerLeave={(e) => e.pointerType === 'mouse' && menu.hideSoon()}
      className="mega-panel glass glass-strong pointer-events-auto absolute left-1/2 top-full mt-3 w-[min(48rem,calc(100vw-3rem))] -translate-x-1/2 overflow-hidden"
    >
      {menu.open === 'work' ? <WorkPanel data={data} /> : <WritingPanel data={data} />}
    </div>
  );
}
