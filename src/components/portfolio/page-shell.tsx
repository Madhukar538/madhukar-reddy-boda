import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Optional buttons shown under the description. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Shared frame for every inner page: big editorial header, then content. */
export function PageShell({ eyebrow, title, description, actions, children, className }: PageShellProps) {
  return (
    <div className={cn('container mx-auto max-w-6xl px-4 md:px-6 pt-10 lg:pt-36 pb-12 lg:pb-20', className)}>
      <header className="mb-10 md:mb-16 max-w-3xl space-y-4">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="text-[2.6rem] sm:text-6xl lg:text-7xl font-bold tracking-[-0.035em] text-foreground leading-[1.02]">
          {title}
        </h1>
        {description && (
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{description}</p>
        )}
        {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
