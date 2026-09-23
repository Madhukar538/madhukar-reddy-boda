'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { ChevronLeft, LogOut, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { LiquidLens } from '@/components/liquid-lens';
import { keyProjects, rdProjects } from '@/data/profile';
import { APPS, appById, type AppDef, type AppId, type OsData } from './apps';

type Win = {
  id: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  payload?: string;
};

const MENU_H = 30;
const DOCK_SPACE = 96;

/* ------------------------------------------------------------ helpers */

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  return now
    ? now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', minute: '2-digit' })
    : '';
}

function useIsMobile() {
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mobile;
}

function AppIcon({ app, size = 52 }: { app: AppDef; size?: number }) {
  const Icon = app.icon;
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-[22%] bg-gradient-to-br text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_16px_-6px_rgba(0,0,0,0.5)]',
        app.tint
      )}
      style={{ width: size, height: size }}
    >
      <Icon className="h-[46%] w-[46%]" />
    </span>
  );
}

/* --------------------------------------------------------------- dock */

function DockItem({ app, mouseX, running, onOpen }: { app: AppDef; mouseX: MotionValue<number>; running: boolean; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  // macOS-style magnification based on distance from the pointer.
  const distance = useTransform(mouseX, (x) => {
    const rect = ref.current?.getBoundingClientRect();
    return rect ? x - rect.left - rect.width / 2 : 999;
  });
  const size = useSpring(useTransform(distance, [-140, 0, 140], [46, 70, 46]), { stiffness: 380, damping: 26 });
  return (
    <button ref={ref} type="button" onClick={onOpen} aria-label={`Open ${app.name}`} className="group relative flex flex-col items-center">
      <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-lg bg-black/70 px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {app.name}
      </span>
      <motion.span style={{ width: size, height: size }} className="block">
        <AppIconFluid app={app} />
      </motion.span>
      <span className={cn('mt-1 h-1 w-1 rounded-full', running ? 'bg-foreground/70' : 'bg-transparent')} />
    </button>
  );
}

function AppIconFluid({ app }: { app: AppDef }) {
  const Icon = app.icon;
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center rounded-[22%] bg-gradient-to-br text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_16px_-6px_rgba(0,0,0,0.5)]',
        app.tint
      )}
    >
      <Icon className="h-[46%] w-[46%]" />
    </span>
  );
}

/* ---------------------------------------------------------- spotlight */

type SpotItem = { label: string; hint: string; app: AppId; payload?: string };

function Spotlight({ data, onClose, onPick }: { data: OsData; onClose: () => void; onPick: (item: SpotItem) => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const all = useMemo<SpotItem[]>(
    () => [
      ...APPS.map((a) => ({ label: a.name, hint: 'App', app: a.id })),
      ...data.posts.map((p) => ({ label: p.title, hint: 'Blog post', app: 'reader' as AppId, payload: p.slug })),
      ...keyProjects.map((p) => ({ label: p.title, hint: 'Project', app: 'projects' as AppId })),
      ...rdProjects.map((p) => ({ label: p.title, hint: `Lab · ${p.status}`, app: 'lab' as AppId })),
    ],
    [data.posts]
  );
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? all.filter((i) => i.label.toLowerCase().includes(s)) : all.slice(0, APPS.length)).slice(0, 8);
  }, [q, all]);
  useEffect(() => setActive(0), [q]);

  return (
    <div className="fixed inset-0 z-[400] flex items-start justify-center bg-black/20 pt-[18vh]" onPointerDown={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="glass glass-strong w-[min(620px,92vw)] p-2"
        style={{ ['--glass-radius' as string]: '1.5rem' }}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Spotlight search"
      >
        <div className="flex items-center gap-3 px-3 py-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === 'Enter' && results[active]) onPick(results[active]);
            }}
            placeholder="Spotlight search: apps, posts, projects…"
            aria-label="Spotlight search"
            className="min-w-0 flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        {results.length > 0 && (
          <ul className="mt-1 border-t border-foreground/10 pt-1">
            {results.map((r, i) => (
              <li key={`${r.hint}-${r.label}`}>
                <button
                  type="button"
                  onPointerEnter={() => setActive(i)}
                  onClick={() => onPick(r)}
                  className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left', i === active && 'bg-primary text-primary-foreground')}
                >
                  <span className="scale-75"><AppIcon app={appById(r.app)} size={30} /></span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.label}</span>
                  <span className={cn('text-xs', i === active ? 'opacity-80' : 'text-muted-foreground')}>{r.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------- window */

function OsWindow({
  win,
  zIndex,
  app,
  focused,
  children,
  onFocus,
  onClose,
  onMinimize,
  onToggleMax,
  onMove,
  onResize,
}: {
  win: Win;
  zIndex: number;
  app: AppDef;
  focused: boolean;
  children: React.ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMax: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
}) {
  const drag = useRef<{ kind: 'move' | 'resize'; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const start = (kind: 'move' | 'resize') => (e: React.PointerEvent) => {
    if (win.maximized && kind === 'move') return;
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    onFocus();
    drag.current = { kind, sx: e.clientX, sy: e.clientY, ox: kind === 'move' ? win.x : win.w, oy: kind === 'move' ? win.y : win.h };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (d.kind === 'move') {
      onMove(Math.min(Math.max(d.ox + dx, -win.w + 120), window.innerWidth - 120), Math.min(Math.max(d.oy + dy, MENU_H + 4), window.innerHeight - 80));
    } else {
      onResize(Math.max(d.ox + dx, 360), Math.max(d.oy + dy, 240));
    }
  };
  const end = () => (drag.current = null);

  const frame = win.maximized
    ? { left: 8, top: MENU_H + 8, width: 'calc(100vw - 16px)', height: `calc(100vh - ${MENU_H + DOCK_SPACE + 12}px)` }
    : { left: win.x, top: win.y, width: win.w, height: win.h };

  return (
    <motion.section
      role="dialog"
      aria-label={app.name}
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={win.minimized ? { opacity: 0, scale: 0.3, y: 400, pointerEvents: 'none' } : { opacity: 1, scale: 1, y: 0, pointerEvents: 'auto' }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
      onPointerDown={onFocus}
      className={cn('glass glass-strong fixed flex flex-col overflow-hidden', focused ? 'shadow-2xl' : 'opacity-[0.97]')}
      style={{ ...frame, zIndex, ['--glass-radius' as string]: '1.1rem' }}
    >
      {/* Title bar */}
      <header
        className="relative z-10 flex h-10 shrink-0 cursor-default select-none items-center border-b border-foreground/10 px-3"
        onPointerDown={start('move')}
        onPointerMove={move}
        onPointerUp={end}
        onDoubleClick={onToggleMax}
      >
        <div className="flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" aria-label="Close" onClick={onClose} className="h-3 w-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10 hover:brightness-90" />
          <button type="button" aria-label="Minimise" onClick={onMinimize} className="h-3 w-3 rounded-full bg-[#febc2e] ring-1 ring-black/10 hover:brightness-90" />
          <button type="button" aria-label="Zoom" onClick={onToggleMax} className="h-3 w-3 rounded-full bg-[#28c840] ring-1 ring-black/10 hover:brightness-90" />
        </div>
        <span className={cn('absolute left-1/2 -translate-x-1/2 text-[13px] font-semibold', focused ? 'text-foreground' : 'text-muted-foreground')}>
          {app.name}
        </span>
      </header>
      <div className="relative z-0 min-h-0 flex-1">{children}</div>
      {!win.maximized && (
        <div
          aria-hidden
          className="absolute bottom-0 right-0 z-20 h-4 w-4 cursor-nwse-resize"
          onPointerDown={start('resize')}
          onPointerMove={move}
          onPointerUp={end}
        />
      )}
    </motion.section>
  );
}

/* ------------------------------------------------------------ desktop */

/** The OS's own wallpaper; it also hides the regular site underneath. */
function Wallpaper() {
  return (
    <div className="liquid-wallpaper" aria-hidden="true">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <div className="blob blob-c" />
      <div className="blob blob-d" />
    </div>
  );
}

/**
 * Rendered into <body>: the page transition wrapper uses a transform (which
 * would make `position: fixed` relative to it) and <main> is its own stacking
 * context below the footer. A portal escapes both.
 */
export function PortfolioOS({ data, onExit }: { data: OsData; onExit: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(<Desktop data={data} onExit={onExit} />, document.body) : null;
}

function Desktop({ data, onExit }: { data: OsData; onExit: () => void }) {
  const isMobile = useIsMobile();
  const clock = useClock();
  const [wins, setWins] = useState<Win[]>([]);
  const [spotlight, setSpotlight] = useState(false);
  const [mobileApp, setMobileApp] = useState<{ id: AppId; payload?: string } | null>(null);
  const zTop = useRef(10);
  const mouseX = useMotionValue(Infinity);

  const focused = wins.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];

  const open = useCallback(
    (id: AppId, payload?: string) => {
      if (isMobile) {
        setMobileApp({ id, payload });
        return;
      }
      setWins((all) => {
        const z = ++zTop.current;
        const existing = all.find((w) => w.id === id);
        if (existing) return all.map((w) => (w.id === id ? { ...w, z, minimized: false, payload: payload ?? w.payload } : w));
        const { w, h } = appById(id).size;
        const vw = window.innerWidth;
        const vh = window.innerHeight - MENU_H - DOCK_SPACE;
        const width = Math.min(w, vw - 40);
        const height = Math.min(h, vh - 20);
        const offset = (all.length % 6) * 28;
        return [
          ...all,
          {
            id,
            payload,
            w: width,
            h: height,
            x: Math.max(20, (vw - width) / 2 - 80 + offset),
            y: Math.max(MENU_H + 12, MENU_H + (vh - height) / 2 - 20 + offset),
            z,
            minimized: false,
            maximized: false,
          },
        ];
      });
    },
    [isMobile]
  );

  const patch = (id: AppId, change: Partial<Win>) => setWins((all) => all.map((w) => (w.id === id ? { ...w, ...change } : w)));
  const focus = (id: AppId) => {
    if (focused?.id === id) return;
    patch(id, { z: ++zTop.current });
  };

  // Opening layout: About, plus a Terminal to invite exploring.
  useEffect(() => {
    if (isMobile === false && wins.length === 0) {
      open('about');
      setTimeout(() => {
        setWins((all) => {
          if (all.some((w) => w.id === 'terminal')) return all;
          const vw = window.innerWidth;
          return [
            ...all,
            { id: 'terminal', x: Math.max(vw - 560, 40), y: window.innerHeight - DOCK_SPACE - 340, w: 520, h: 300, z: ++zTop.current, minimized: false, maximized: false },
          ];
        });
      }, 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // ⌘K / Ctrl+K for Spotlight; Esc closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlight((s) => !s);
      }
      if (e.key === 'Escape') setSpotlight(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The desktop owns the viewport while it's open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const pick = (item: SpotItem) => {
    setSpotlight(false);
    open(item.app, item.payload);
  };

  const ctx = (payload?: string) => ({ data, payload, open, exit: onExit });

  if (isMobile === null) return <div className="fixed inset-0 z-[120]"><Wallpaper /></div>;

  /* ---------------------------------------------- mobile: home screen */
  if (isMobile) {
    const current = mobileApp ? appById(mobileApp.id) : null;
    return (
      <div className="fixed inset-0 z-[120] flex flex-col">
        <Wallpaper />
        <div className="flex h-8 shrink-0 items-center justify-between px-5 text-xs font-semibold text-foreground">
          <span>{clock.split(' ').slice(-2).join(' ')}</span>
          <button type="button" onClick={onExit} className="flex items-center gap-1 text-primary">Exit <LogOut className="h-3 w-3" /></button>
        </div>
        <AnimatePresence mode="wait">
          {current ? (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="glass glass-strong mx-2 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden"
              style={{ ['--glass-radius' as string]: '1.5rem' }}
            >
              <div className="relative z-10 flex h-11 shrink-0 items-center border-b border-foreground/10 px-2">
                <button type="button" onClick={() => setMobileApp(null)} className="flex items-center text-sm font-medium text-primary">
                  <ChevronLeft className="h-5 w-5" /> Home
                </button>
                <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-foreground">{current.name}</span>
              </div>
              <div className="relative z-0 min-h-0 flex-1">{current.render(ctx(mobileApp?.payload))}</div>
            </motion.div>
          ) : (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
              <div className="grid grid-cols-4 gap-y-6 px-5 pt-8">
                {APPS.map((a) => (
                  <button key={a.id} type="button" onClick={() => open(a.id)} className="flex flex-col items-center gap-1.5">
                    <AppIcon app={a} size={58} />
                    <span className="text-[11px] font-medium text-foreground">{a.name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-auto mb-6 text-center text-xs text-muted-foreground">madhukar-os · tap an app</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ---------------------------------------------------- desktop: macOS */
  const running = new Set(wins.map((w) => w.id));
  // Stack by rank so windows always stay below the menu bar and dock (z 300).
  const rank = new Map([...wins].sort((a, b) => a.z - b.z).map((w, i) => [w.id, 10 + i]));
  return (
    <div className="fixed inset-0 z-[120]">
      <Wallpaper />
      {/* Menu bar */}
      <div className="glass glass-strong fixed inset-x-0 top-0 z-[300] flex select-none items-center gap-4 px-4 text-[13px]" style={{ height: MENU_H, ['--glass-radius' as string]: '0' }}>
        <LiquidLens strength={20} />
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">MR</span>
        <span className="font-semibold text-foreground">{focused ? appById(focused.id).name : 'Finder'}</span>
        <span className="hidden text-foreground/70 lg:inline">madhukar-os</span>
        <div className="ml-auto flex items-center gap-3 text-foreground/85">
          <button type="button" onClick={() => setSpotlight(true)} className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-foreground/10" aria-label="Spotlight (⌘K)">
            <Search className="h-3.5 w-3.5" /> <span className="text-xs text-muted-foreground">⌘K</span>
          </button>
          <span className="scale-75"><ThemeToggle /></span>
          <span className="tabular-nums">{clock}</span>
          <button type="button" onClick={onExit} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-foreground/10">
            <LogOut className="h-3.5 w-3.5" /> Exit
          </button>
        </div>
      </div>

      {/* Desktop hint */}
      <div className="pointer-events-none fixed left-6 top-12 z-[1] text-foreground/80">
        <p className="text-4xl font-bold tracking-tight">Boda Madhukar Reddy</p>
        <p className="mt-1 text-sm text-muted-foreground">Software Architect · double-click a title bar to zoom · ⌘K to search</p>
      </div>

      {/* Windows */}
      <AnimatePresence>
        {wins.map((w) => {
          const app = appById(w.id);
          return (
            <OsWindow
              key={w.id}
              win={w}
              zIndex={rank.get(w.id) ?? 10}
              app={app}
              focused={focused?.id === w.id}
              onFocus={() => focus(w.id)}
              onClose={() => setWins((all) => all.filter((x) => x.id !== w.id))}
              onMinimize={() => patch(w.id, { minimized: true })}
              onToggleMax={() => patch(w.id, { maximized: !w.maximized, z: ++zTop.current })}
              onMove={(x, y) => patch(w.id, { x, y })}
              onResize={(width, height) => patch(w.id, { w: width, h: height })}
            >
              {app.render(ctx(w.payload))}
            </OsWindow>
          );
        })}
      </AnimatePresence>

      {/* Dock */}
      <div className="fixed inset-x-0 bottom-3 z-[300] flex justify-center">
        <div
          className="glass glass-strong glass-pill flex select-none items-end gap-2 px-3 pb-1.5 pt-2"
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
        >
          <LiquidLens strength={30} />
          {APPS.map((a) => (
            <DockItem key={a.id} app={a} mouseX={mouseX} running={running.has(a.id)} onOpen={() => open(a.id)} />
          ))}
        </div>
      </div>

      <AnimatePresence>{spotlight && <Spotlight data={data} onClose={() => setSpotlight(false)} onPick={pick} />}</AnimatePresence>
    </div>
  );
}
