import { Section } from '@/components/portfolio/section';

export function Summary() {
  return (
    <Section id="about" title="about_me()" comment="Professional summary">
      <div className="terminal-card p-6 md:p-8">
        {/* Terminal header bar */}
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 font-mono text-xs text-muted-foreground">about.md</span>
        </div>

        <div className="space-y-3 font-mono text-sm leading-relaxed">
          <p className="text-muted-foreground text-xs">{'/**'}</p>
          <p className="text-muted-foreground text-xs pl-2">
            * Backend-focused Software Architect with strong experience in building,
          </p>
          <p className="text-muted-foreground text-xs pl-2">
            * optimizing, and scaling high-traffic systems.
          </p>
          <p className="text-muted-foreground text-xs">{'*'}</p>
          <p className="text-muted-foreground text-xs pl-2">
            * Specialization stack: .NET Core APIs · Solr · Redis · MSSQL · Node.js
          </p>
          <p className="text-muted-foreground text-xs pl-2">
            * Performance suite: k6 + Grafana load testing · memory optimization · GC tuning
          </p>
          <p className="text-muted-foreground text-xs">{'*'}</p>
          <p className="text-muted-foreground text-xs pl-2">
            * Approach: production-first — diagnose fast, fix right, prevent recurrence.
          </p>
          <p className="text-muted-foreground text-xs pl-2">
            * Exploring: AI-assisted development · RAG systems · observability engineering
          </p>
          <p className="text-muted-foreground text-xs">{'*/'}</p>

          <div className="pt-3 space-y-1.5">
            <p>
              <span className="text-primary">const</span>{' '}
              <span className="text-blue-400">architect</span>{' '}
              <span className="text-foreground/60">=</span>{' '}
              <span className="text-yellow-400">&#123;</span>
            </p>
            <p className="pl-6">
              <span className="text-green-400">focus</span>:{' '}
              <span className="text-orange-400">'Backend · APIs · Performance'</span>,
            </p>
            <p className="pl-6">
              <span className="text-green-400">primaryStack</span>:{' '}
              <span className="text-orange-400">'.NET Core · SQL Server · Redis'</span>,
            </p>
            <p className="pl-6">
              <span className="text-green-400">yearsExp</span>:{' '}
              <span className="text-cyan-400">5</span>,
            </p>
            <p className="pl-6">
              <span className="text-green-400">openToWork</span>:{' '}
              <span className="text-primary">true</span>,
            </p>
            <p><span className="text-yellow-400">&#125;</span>;</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
