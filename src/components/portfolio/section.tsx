import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, children, className }: SectionProps) {
  return (
    <section id={id} className={cn('py-8 md:py-12', className)}>
      <h2 className="mb-6 md:mb-8 text-3xl font-bold tracking-tighter text-center md:text-4xl font-headline text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}
