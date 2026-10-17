import { Section } from '@/components/portfolio/section';
import {
  BrainCircuit,
  Code2,
  Container,
  Database,
  Gauge,
  Layout,
  Radio,
  Search,
  Server,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SkillCategory } from '@/data/profile';

const icons: Record<string, LucideIcon> = {
  Languages: Code2,
  Backend: Server,
  'Frontend & Mobile': Layout,
  'AI & LLMs': BrainCircuit,
  'Search & Vectors': Search,
  'Data & Caching': Database,
  'Messaging & Realtime': Radio,
  'DevOps & Infrastructure': Container,
  'Observability & Quality': Gauge,
};


const iconTint = {
  green: 'text-primary bg-primary/[0.12]',
  cyan: 'text-[hsl(var(--sys-teal))] bg-[hsl(var(--sys-teal)/0.12)]',
  amber: 'text-[hsl(var(--sys-orange))] bg-[hsl(var(--sys-orange)/0.12)]',
};

export function Skills({ skillCategories }: { skillCategories: SkillCategory[] }) {
  return (
    <Section id="skills" title="Tech Stack" comment="Skills and technologies" data={skillCategories}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
        {skillCategories.map(({ title, skills, color = 'green' }) => {
          const Icon = icons[title] ?? Code2;
          return (
          <div key={title} className="cs-reveal glass p-5 max-sm:p-4">
            <div className="flex items-center gap-3 mb-4 max-sm:mb-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTint[color]}`}>
                <Icon className="h-[1.1rem] w-[1.1rem]" />
              </span>
              <span className="text-[15px] font-semibold text-foreground">{title}</span>
            </div>
            {/* Phones: one swipeable row per group instead of a tall block of tags. */}
            <div className="skill-row flex flex-wrap gap-1.5 max-sm:-mx-4 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-1">
              {skills.map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          );
        })}
      </div>
    </Section>
  );
}
