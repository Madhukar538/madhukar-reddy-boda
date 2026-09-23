'use client';

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import {
  Bot,
  Briefcase,
  FileText,
  FlaskConical,
  FolderKanban,
  Network,
  PenLine,
  Terminal as TerminalIcon,
  User,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Summary } from '@/components/portfolio/summary';
import { Skills } from '@/components/portfolio/skills';
import { Education } from '@/components/portfolio/education';
import { Experience } from '@/components/portfolio/experience';
import { Projects } from '@/components/portfolio/projects';
import { Research } from '@/components/portfolio/research';
import { MadhuBot } from '@/components/portfolio/madhu-bot';
import { KnowledgeGraphView } from '@/components/portfolio/knowledge-graph';
import { ArchitectureDiagram } from '@/components/portfolio/architecture-diagram';
import { diagrams } from '@/data/diagrams';
import { experience, keyProjects, profile, rdProjects, skillCategories } from '@/data/profile';
import type { KnowledgeGraph } from '@/lib/knowledge-graph';

export type OsPost = {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  category: string;
  excerpt: string;
  content: string;
};

export type OsData = { posts: OsPost[]; graph: KnowledgeGraph };

export type AppId = 'about' | 'experience' | 'projects' | 'lab' | 'reader' | 'graph' | 'bot' | 'resume' | 'terminal';

export type AppContext = {
  data: OsData;
  payload?: string;
  open: (id: AppId, payload?: string) => void;
};

export type AppDef = {
  id: AppId;
  name: string;
  icon: ComponentType<{ className?: string }>;
  /** Tailwind gradient classes for the app icon tile. */
  tint: string;
  size: { w: number; h: number };
  render: (ctx: AppContext) => ReactNode;
};

/* ---------------------------------------------------------------- Reader */

function ReaderApp({ data, payload }: AppContext) {
  const [slug, setSlug] = useState(payload ?? data.posts[0]?.slug);
  useEffect(() => {
    if (payload) setSlug(payload);
  }, [payload]);
  const post = data.posts.find((p) => p.slug === slug) ?? data.posts[0];
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => scrollRef.current?.scrollTo({ top: 0 }), [slug]);
  const diagram = post ? diagrams[post.slug] : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <nav className="shrink-0 border-b border-foreground/10 md:w-64 md:border-b-0 md:border-r overflow-x-auto md:overflow-y-auto">
        <ul className="flex gap-1 p-2 md:flex-col">
          {data.posts.map((p) => (
            <li key={p.slug} className="shrink-0 md:shrink">
              <button
                type="button"
                onClick={() => setSlug(p.slug)}
                className={cn(
                  'w-56 rounded-xl px-3 py-2 text-left transition-colors md:w-full',
                  p.slug === post?.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-foreground/5'
                )}
              >
                <span className="line-clamp-2 text-[13px] font-semibold leading-snug">{p.title}</span>
                <span className={cn('text-[11px]', p.slug === post?.slug ? 'opacity-80' : 'text-muted-foreground')}>
                  {p.date}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {post && (
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-5 md:p-8">
          <p className="eyebrow">{post.category} · {post.readTime}</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-foreground">{post.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
          {diagram && <ArchitectureDiagram diagram={diagram} />}
          <div
            className="article-body mt-6 space-y-5 text-[15px] leading-relaxed text-foreground/85
              [&_p>code]:rounded-md [&_p>code]:bg-foreground/10 [&_p>code]:px-1.5 [&_p>code]:text-[0.85em] [&_p>code]:text-primary
              [&_li>code]:rounded-md [&_li>code]:bg-foreground/10 [&_li>code]:px-1.5 [&_li>code]:text-[0.85em] [&_li>code]:text-primary
              [&>h2]:mt-8 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-foreground [&>ul]:list-disc [&>ul]:space-y-1.5 [&>ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- Terminal */

type Line = { kind: 'in' | 'out'; text: string };

const APP_ALIASES: Record<string, AppId> = {
  about: 'about', experience: 'experience', exp: 'experience', projects: 'projects', work: 'projects',
  lab: 'lab', blog: 'reader', reader: 'reader', graph: 'graph', bot: 'bot', 'madhu-bot': 'bot',
  resume: 'resume', cv: 'resume', terminal: 'terminal',
};

function TerminalApp({ data, open }: AppContext) {
  const { setTheme } = useTheme();
  const [lines, setLines] = useState<Line[]>([
    { kind: 'out', text: `Welcome to madhukar-os. Type 'help' to see what you can do.` },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [lines]);

  const run = (raw: string): string | null => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    const arg = args.join(' ').toLowerCase();
    switch (cmd?.toLowerCase()) {
      case '':
        return '';
      case 'help':
        return [
          'whoami            who I am',
          'ls <projects|lab|posts|skills|apps>',
          'open <app>        open an app (about, projects, lab, blog, graph, bot, resume)',
          'read <n>          open blog post n from `ls posts`',
          'cat resume        the short version',
          'neofetch          system info, the fun way',
          'contact           how to reach me',
          'theme <dark|light>',
          'date · echo · clear · exit',
        ].join('\n');
      case 'whoami':
        return `${profile.name}\n${profile.title} @ ${profile.company} · ${profile.location}`;
      case 'ls': {
        if (arg.startsWith('project')) return keyProjects.map((p) => `• ${p.title}`).join('\n');
        if (arg === 'lab') return rdProjects.map((p) => `• [${p.status}] ${p.title}`).join('\n');
        if (arg.startsWith('post') || arg === 'blog') return data.posts.map((p, i) => `${i + 1}. ${p.title}`).join('\n');
        if (arg.startsWith('skill')) return skillCategories.map((c) => `${c.title}: ${c.skills.join(', ')}`).join('\n');
        return 'about  experience  projects  lab  blog  graph  bot  resume  terminal';
      }
      case 'open': {
        const id = APP_ALIASES[arg];
        if (!id) return `open: unknown app '${arg}'. Try: ls apps`;
        open(id);
        return `Opening ${id}…`;
      }
      case 'read': {
        const n = Number(arg);
        const post = data.posts[n - 1];
        if (!post) return `read: no post ${arg || '(missing number)'}. Try: ls posts`;
        open('reader', post.slug);
        return `Opening “${post.title}”…`;
      }
      case 'cat':
        if (arg === 'resume' || arg === 'resume.pdf')
          return `${profile.summary}\n\nCurrently: ${experience.title}, ${experience.company} (${experience.duration})\nFull PDF: /resume.pdf  (or: open resume)`;
        return `cat: ${arg || '(missing file)'}: No such file`;
      case 'neofetch':
        return [
          '   ╭────────╮     madhukar@portfolio',
          '   │  M R   │     ──────────────────',
          '   ╰────────╯     OS: madhukar-os (Liquid Glass)',
          `                  Role: ${profile.title}`,
          `                  Uptime: ${new Date().getFullYear() - 2021}+ yrs at ${profile.company}`,
          '                  Shell: .NET 10 · Next.js 16',
          '                  AI: RAG · MCP · Semantic Kernel',
          `                  Projects: ${keyProjects.length} key · ${rdProjects.length} lab`,
          `                  Posts: ${data.posts.length}`,
        ].join('\n');
      case 'contact':
        return `email  ${profile.email}\nphone  ${profile.phone}\ngithub ${profile.github}`;
      case 'theme':
        if (arg === 'dark' || arg === 'light') {
          setTheme(arg);
          return `Theme set to ${arg}.`;
        }
        return 'usage: theme <dark|light>';
      case 'date':
        return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' (Hyderabad)';
      case 'echo':
        return args.join(' ');
      case 'sudo':
        return arg.includes('hire') ? `Permission granted. Email ${profile.email} 🙂` : 'sudo: nice try.';
      case 'clear':
        setLines([]);
        return null;
      case 'exit':
        window.location.href = '/';
        return 'Bye!';
      default:
        return `${cmd}: command not found. Type 'help'.`;
    }
  };

  const submit = () => {
    const out = run(input);
    if (out !== null) setLines((l) => [...l, { kind: 'in', text: input }, ...(out ? [{ kind: 'out' as const, text: out }] : [])]);
    if (input.trim()) setHistory((h) => [input, ...h].slice(0, 50));
    setCursor(-1);
    setInput('');
  };

  return (
    <div
      className="h-full overflow-y-auto bg-black/70 p-4 font-mono text-[12.5px] leading-relaxed text-[#d4f7d4]"
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((l, i) => (
        <pre key={i} className={cn('whitespace-pre-wrap', l.kind === 'in' && 'text-white')}>
          {l.kind === 'in' ? <><span className="text-[#5af78e]">madhukar@portfolio</span><span className="text-white/60"> ~ % </span>{l.text}</> : l.text}
        </pre>
      ))}
      <div className="flex items-center">
        <span className="text-[#5af78e]">madhukar@portfolio</span>
        <span className="text-white/60">&nbsp;~ %&nbsp;</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              const next = Math.min(cursor + 1, history.length - 1);
              if (history[next] !== undefined) { setCursor(next); setInput(history[next]); }
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              const next = cursor - 1;
              setCursor(Math.max(next, -1));
              setInput(next >= 0 ? history[next] : '');
            }
          }}
          aria-label="Terminal input"
          spellCheck={false}
          autoCapitalize="off"
          className="min-w-0 flex-1 bg-transparent text-white caret-[#5af78e] outline-none"
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}

/* ---------------------------------------------------------------- Résumé */

function ResumeApp() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-2">
        <span className="text-sm text-muted-foreground">Boda-Madhukar-Reddy-Resume.pdf</span>
        <a href="/resume.pdf" download="Boda-Madhukar-Reddy-Resume.pdf" className="tinted-button !px-3 !py-1 !text-xs">
          <Download className="h-3.5 w-3.5" /> Download
        </a>
      </div>
      <iframe src="/resume.pdf#view=FitH" title="Résumé" className="min-h-0 flex-1 bg-white" />
    </div>
  );
}

/* ------------------------------------------------------------- Registry */

const page = (children: ReactNode) => <div className="h-full overflow-y-auto p-5 md:p-7">{children}</div>;

export const APPS: AppDef[] = [
  { id: 'about', name: 'About', icon: User, tint: 'from-sky-400 to-blue-600', size: { w: 760, h: 560 },
    render: () => page(<><Summary /><Skills /><Education /></>) },
  { id: 'experience', name: 'Experience', icon: Briefcase, tint: 'from-indigo-400 to-violet-600', size: { w: 760, h: 560 },
    render: () => page(<Experience />) },
  { id: 'projects', name: 'Projects', icon: FolderKanban, tint: 'from-teal-300 to-cyan-600', size: { w: 860, h: 600 },
    render: () => page(<Projects />) },
  { id: 'lab', name: 'R&D Lab', icon: FlaskConical, tint: 'from-fuchsia-400 to-purple-700', size: { w: 860, h: 600 },
    render: () => page(<Research />) },
  { id: 'reader', name: 'Reader', icon: PenLine, tint: 'from-orange-300 to-rose-500', size: { w: 980, h: 640 },
    render: (ctx) => <ReaderApp {...ctx} /> },
  { id: 'graph', name: 'Graph', icon: Network, tint: 'from-amber-300 to-orange-600', size: { w: 980, h: 640 },
    render: ({ data }) => page(<KnowledgeGraphView graph={data.graph} />) },
  { id: 'bot', name: 'Madhu-bot', icon: Bot, tint: 'from-emerald-300 to-teal-600', size: { w: 640, h: 620 },
    render: () => <MadhuBot compact /> },
  { id: 'resume', name: 'Résumé', icon: FileText, tint: 'from-slate-200 to-slate-500', size: { w: 700, h: 640 },
    render: () => <ResumeApp /> },
  { id: 'terminal', name: 'Terminal', icon: TerminalIcon, tint: 'from-zinc-600 to-zinc-900', size: { w: 620, h: 400 },
    render: (ctx) => <TerminalApp {...ctx} /> },
];

export const appById = (id: AppId) => APPS.find((a) => a.id === id)!;
