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
  green: 'text-primary bg-primary/10 border border-primary/20',
  cyan: 'text-primary bg-primary/10 border border-primary/20',
  amber: 'text-primary bg-primary/10 border border-primary/20',
};

const CORE_SKILLS = new Set([
  'C#',
  '.NET 10 / ASP.NET Core',
  'Next.js 16 (App Router, ISR)',
  'RAG',
  'Semantic Kernel',
  'Microsoft Agent Framework',
  'MCP (Model Context Protocol)',
  'Solr 9 (kNN, Suggester, MLT)',
  'Hybrid BM25 + Vector (RRF)',
  'pgvector',
  'SQL Server',
  'Redis',
  'RabbitMQ',
  'Docker',
  'k6',
  'Grafana',
]);

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
            <div className="skill-row flex flex-wrap gap-1.5">
              {skills.map((skill) => {
                const isCore = CORE_SKILLS.has(skill);
                return (
                  <span key={skill} className={isCore ? 'chip chip-accent font-semibold' : 'chip'}>
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </Section>
  );
}
