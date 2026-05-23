import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  comment?: string;
}

export function Section({ id, title, children, className, comment }: SectionProps) {
  return (
    <section id={id} className={cn('py-10 md:py-14', className)}>
      {/* Terminal-style section header */}
      <div className="mb-8 space-y-1">
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
      {children}
    </section>
  );
}
