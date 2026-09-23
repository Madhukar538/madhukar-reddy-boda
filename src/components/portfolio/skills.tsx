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
import { skillCategories } from '@/data/profile';

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

export function Skills() {

  return (
    <Section id="skills" title="Tech Stack" comment="Skills and technologies" data={skillCategories}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {skillCategories.map(({ title, skills, color = 'green' }) => {
          const Icon = icons[title] ?? Code2;
          return (
          <div key={title} className="glass glass-interactive p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTint[color]}`}>
                <Icon className="h-[1.1rem] w-[1.1rem]" />
              </span>
              <span className="text-[15px] font-semibold text-foreground">{title}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
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
