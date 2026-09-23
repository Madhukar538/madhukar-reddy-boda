import { Section } from '@/components/portfolio/section';
import {
  BrainCircuit,
  Code2,
  Cpu,
  Database,
  AreaChart,
  Router,
  Server,
  Smartphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type SkillCategory = {
  title: string;
  icon: LucideIcon;
  skills: string[];
  color?: 'green' | 'cyan' | 'amber';
};

const skillData: SkillCategory[] = [
  {
    title: 'Languages',
    icon: Code2,
    color: 'green',
    skills: ['C#', 'TypeScript', 'JavaScript', 'Python', 'C'],
  },
  {
    title: 'Frameworks',
    icon: Server,
    color: 'cyan',
    skills: ['.NET Core (API, MVC)', 'Angular', 'Node.js', 'React Native'],
  },
  {
    title: 'Databases & ORMs',
    icon: Database,
    color: 'amber',
    skills: ['SQL Server', 'ADO.NET', 'Dapper', 'EF Core'],
  },
  {
    title: 'NoSQL & Caching',
    icon: AreaChart,
    color: 'cyan',
    skills: ['Solr', 'MongoDB', 'Redis', 'Memcached'],
  },
  {
    title: 'AI / ML',
    icon: BrainCircuit,
    color: 'green',
    skills: ['RAG', 'LangChain', 'NLP', 'OpenCV'],
  },
  {
    title: 'Observability',
    icon: AreaChart,
    color: 'amber',
    skills: ['k6', 'Grafana', 'Load Testing', 'SLA'],
  },
  {
    title: 'IoT & Messaging',
    icon: Router,
    color: 'cyan',
    skills: ['MQTT', 'RabbitMQ', 'gRPC', 'SignalR'],
  },
  {
    title: 'Dev Tools',
    icon: Cpu,
    color: 'green',
    skills: ['VS Code', 'Rider', 'Postman', 'Playwright', 'Docker'],
  },
  {
    title: 'Mobile',
    icon: Smartphone,
    color: 'amber',
    skills: ['React Native (Android & iOS)'],
  },
];

const iconTint = {
  green: 'text-primary bg-primary/[0.12]',
  cyan: 'text-[hsl(var(--sys-teal))] bg-[hsl(var(--sys-teal)/0.12)]',
  amber: 'text-[hsl(var(--sys-orange))] bg-[hsl(var(--sys-orange)/0.12)]',
};

export function Skills() {
  const serializableSkillData = skillData.map(({ title, skills, color }) => ({
    title,
    skills,
    color,
  }));

  return (
    <Section id="skills" title="Tech Stack" comment="Skills and technologies" data={serializableSkillData}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {skillData.map(({ title, icon: Icon, skills, color = 'green' }) => (
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
        ))}
      </div>
    </Section>
  );
}
