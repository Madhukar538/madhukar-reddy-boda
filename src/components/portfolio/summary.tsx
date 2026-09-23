import { Section } from '@/components/portfolio/section';
import { Gauge, Layers, Sparkles, Target } from 'lucide-react';

const facts = [
  { icon: Target,   label: 'Focus',         value: 'Backend · AI platforms · Performance' },
  { icon: Layers,   label: 'Primary stack', value: '.NET 10 · Next.js · SQL Server · Redis' },
  { icon: Gauge,    label: 'Experience',    value: '5+ years' },
  { icon: Sparkles, label: 'Open to',       value: 'Fixing bugs & giving solutions', highlight: true },
];

export function Summary() {
  return (
    <Section id="about" title="Overview" comment="Professional summary">
      <div className="glass p-6 md:p-8 space-y-6">
        <p className="text-lg md:text-xl leading-relaxed text-foreground/90 font-medium">
          Backend-focused Software Architect building, optimizing and scaling{' '}
          <span className="text-gradient font-semibold">high-traffic systems</span> and self-hosted AI platforms.
        </p>

        <div className="space-y-2 text-[15px] leading-relaxed text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Specialization — </span>
            .NET 10 APIs · Next.js · Solr · Redis · SQL Server · MongoDB
          </p>
          <p>
            <span className="font-semibold text-foreground">Performance — </span>
            k6 + Grafana · query & index tuning · memory and GC optimization
          </p>
          <p>
            <span className="font-semibold text-foreground">AI — </span>
            RAG · Semantic Kernel · MCP servers · hybrid vector search · self-hosted LLMs (Ollama)
          </p>
          <p>
            <span className="font-semibold text-foreground">Approach — </span>
            production-first: diagnose fast, fix right, prevent recurrence.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {facts.map(({ icon: Icon, label, value, highlight }) => (
            <div key={label} className="glass-inset p-4">
              <Icon className={highlight ? 'h-5 w-5 text-[hsl(var(--sys-green))] mb-2' : 'h-5 w-5 text-primary mb-2'} />
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground leading-snug">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
