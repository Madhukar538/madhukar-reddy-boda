'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { Section } from '@/components/portfolio/section';
import { cn } from '@/lib/utils';
import { rdProjects, type Status } from '@/data/profile';


const statusChip: Record<Status, { className: string; label: string }> = {
  SHIPPED: { className: 'chip chip-green', label: 'Shipped' },
  WIP: { className: 'chip chip-teal', label: 'In progress' },
  POC: { className: 'chip chip-orange', label: 'Proof of concept' },
  RESEARCH: { className: 'chip chip-purple', label: 'Research' },
};

const filters: { id: 'ALL' | Status; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'WIP', label: 'In progress' },
  { id: 'POC', label: 'PoC' },
  { id: 'RESEARCH', label: 'Research' },
];

export function Research() {
  const [filter, setFilter] = useState<'ALL' | Status>('ALL');
  const visible = filter === 'ALL' ? rdProjects : rdProjects.filter((p) => p.status === filter);

  return (
    <Section id="research" title="Experiments" comment={`${rdProjects.length} projects · shipped tools, prototypes and research`}>
      <div className="mb-6 -mx-4 px-4 overflow-x-auto">
        <div className="glass glass-pill inline-flex items-center p-1" role="tablist" aria-label="Filter by status">
          {filters.map(({ id, label }) => {
            const isActive = filter === id;
            const count = id === 'ALL' ? rdProjects.length : rdProjects.filter((p) => p.status === id).length;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(id)}
                className={cn(
                  'relative whitespace-nowrap px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors duration-200',
                  isActive ? 'text-primary-foreground' : 'text-foreground/65 hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="lab-filter"
                    className="absolute inset-0 rounded-full bg-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_-4px_hsl(var(--primary)/0.6)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">
                  {label} <span className="opacity-60 tabular-nums">{count}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {visible.map((project) => {
          const status = statusChip[project.status];
          return (
            <div key={project.title} className="glass glass-interactive p-5 flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--sys-purple)/0.14)] text-[hsl(var(--sys-purple))]">
                  <FlaskConical className="h-[1.1rem] w-[1.1rem]" />
                </span>
                <span className={status.className}>{status.label}</span>
              </div>
              <h3 className="text-[17px] font-semibold text-foreground mb-1.5 leading-snug">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
              {project.post && (
                <Link
                  href={`/blog/${project.post}`}
                  className="group mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  Read the write-up
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
