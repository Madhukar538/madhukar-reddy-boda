import { Section } from '@/components/portfolio/section';

export function Summary() {
  return (
    <Section id="about" title="about_me()" comment="Professional summary">
      <div className="terminal-card p-6 md:p-8">
        {/* Terminal header bar */}
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          <span className="ml-2 font-mono text-xs text-muted-foreground">about.md</span>
        </div>

        <div className="space-y-3 font-mono text-sm leading-relaxed">
          {/* JSDoc comment block */}
          <p className="text-muted-foreground/50 text-xs">{'/**'}</p>
          <p className="text-muted-foreground/60 text-xs pl-2">
            * Backend-focused Software Architect with strong experience in building,
          </p>
          <p className="text-muted-foreground/60 text-xs pl-2">
            * optimizing, and scaling high-traffic systems.
          </p>
          <p className="text-muted-foreground/40 text-xs">{'*'}</p>
          <p className="text-muted-foreground/60 text-xs pl-2">
            * Specialization: .NET Core APIs · Solr · Redis · MSSQL · Node.js
          </p>
          <p className="text-muted-foreground/60 text-xs pl-2">
            * Performance: k6 + Grafana · memory optimization · GC tuning
          </p>
          <p className="text-muted-foreground/40 text-xs">{'*'}</p>
          <p className="text-muted-foreground/60 text-xs pl-2">
            * Approach: production-first — diagnose fast, fix right, prevent recurrence.
          </p>
          <p className="text-muted-foreground/40 text-xs">{'*/'}</p>

          {/* JS object literal — softer colors */}
          <div className="pt-3 space-y-1.5">
            <p>
              <span className="text-primary/80">const</span>{' '}
              <span className="text-foreground/70">architect</span>{' '}
              <span className="text-muted-foreground">=</span>{' '}
              <span className="text-muted-foreground">{'{'}</span>
            </p>
            <p className="pl-6">
              <span className="text-accent/80">focus</span>
              <span className="text-muted-foreground">: </span>
              <span className="text-foreground/60">'Backend · APIs · Performance'</span>
              <span className="text-muted-foreground">,</span>
            </p>
            <p className="pl-6">
              <span className="text-accent/80">primaryStack</span>
              <span className="text-muted-foreground">: </span>
              <span className="text-foreground/60">'.NET Core · SQL Server · Redis'</span>
              <span className="text-muted-foreground">,</span>
            </p>
            <p className="pl-6">
              <span className="text-accent/80">yearsExp</span>
              <span className="text-muted-foreground">: </span>
              <span className="text-primary/70">5</span>
              <span className="text-muted-foreground">,</span>
            </p>
            <p className="pl-6">
              <span className="text-accent/80">openToWork</span>
              <span className="text-muted-foreground">: </span>
              <span className="text-primary/70">true</span>
              <span className="text-muted-foreground">,</span>
            </p>
            <p><span className="text-muted-foreground">{'}'}</span>;</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
