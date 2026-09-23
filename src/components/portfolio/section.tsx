'use client';

import { cn } from '@/lib/utils';
import { useState, type ReactNode } from 'react';
import { toYaml, highlightJson, highlightYaml } from '@/lib/formatter';
import { Check, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <section id={id} className={cn('py-6 md:py-8 lg:py-10 scroll-mt-24', className)}>
      <div className="mb-5 md:mb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1 flex-1">
          {comment && <p className="eyebrow">{comment}</p>}
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
        </div>

        {/* Segmented control: UI / JSON / YAML */}
        {data && (
          <div className="glass glass-pill self-start sm:self-auto flex items-center p-1" role="tablist">
            {(['ui', 'json', 'yaml'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'relative px-3.5 py-1 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors duration-200',
                  viewMode === mode ? 'text-foreground' : 'text-foreground/55 hover:text-foreground'
                )}
              >
                {viewMode === mode && (
                  <motion.span
                    layoutId={`segment-${id}`}
                    className="absolute inset-0 rounded-full bg-background/80 dark:bg-foreground/15 shadow-[0_1px_4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{mode}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'ui' ? (
        children
      ) : (
        <div className="glass overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-foreground/10">
            <span className="text-xs font-medium text-muted-foreground">
              {id}.{viewMode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
              title="Copy code"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[hsl(var(--sys-green))]" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>
          <div className="p-5 md:p-6">{renderCodeContent()}</div>
        </div>
      )}
    </section>
  );
}
