'use client';

import { cn } from '@/lib/utils';
import { useState, type ReactNode } from 'react';
import { toYaml, highlightJson, highlightYaml } from '@/lib/formatter';
import { Check, Copy } from 'lucide-react';

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  comment?: string;
  data?: any; // Structured data for the section to support JSON/YAML code views
}

export function Section({ id, title, children, className, comment, data }: SectionProps) {
  const [viewMode, setViewMode] = useState<'ui' | 'json' | 'yaml'>('ui');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!data) return;
    const text = viewMode === 'json' ? JSON.stringify(data, null, 2) : toYaml(data);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderCodeContent = () => {
    if (!data) return null;
    if (viewMode === 'json') {
      const jsonStr = JSON.stringify(data, null, 2);
      return (
        <pre 
          className="font-mono text-xs overflow-x-auto leading-relaxed select-text"
          dangerouslySetInnerHTML={{ __html: highlightJson(jsonStr) }}
        />
      );
    }
    if (viewMode === 'yaml') {
      const yamlStr = toYaml(data);
      return (
        <pre 
          className="font-mono text-xs overflow-x-auto leading-relaxed select-text"
          dangerouslySetInnerHTML={{ __html: highlightYaml(yamlStr) }}
        />
      );
    }
    return null;
  };

  return (
    <section id={id} className={cn('py-5 md:py-8 lg:py-10', className)}>
      {/* Terminal-style section header */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1 flex-1">
          {comment && (
            <p className="font-mono text-xs text-muted-foreground/60">
              {'// '}{comment}
            </p>
          )}
          <div className="flex items-center gap-3">
            <span className="font-mono text-primary font-bold text-sm select-none">##</span>
            <h2 className="font-mono text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent" />
          </div>
        </div>

        {/* View Toggle Tabs */}
        {data && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-background/50 border border-border/80 rounded-sm p-1">
            {(['ui', 'json', 'yaml'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider rounded-sm transition-all duration-150',
                  viewMode === mode
                    ? 'text-primary bg-primary/10 border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                )}
              >
                [{mode}]
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Rendering */}
      {viewMode === 'ui' ? (
        children
      ) : (
        <div className="relative terminal-card overflow-hidden">
          {/* Chrome top bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card/80">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {id}_data.{viewMode}
              </span>
            </div>
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-sm hover:bg-background/80 text-muted-foreground hover:text-primary transition-all duration-200"
              title="Copy code"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div className="p-5 md:p-6 bg-card/45 backdrop-blur-xl">
            {renderCodeContent()}
          </div>
        </div>
      )}
    </section>
  );
}
