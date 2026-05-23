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

const colorMap = {
  green: 'code-tag',
  cyan: 'code-tag code-tag-cyan',
  amber: 'code-tag code-tag-amber',
};

export function Skills() {
  const serializableSkillData = skillData.map(({ title, skills, color }) => ({
    title,
    skills,
    color,
  }));

  return (
    <Section id="skills" title="tech_stack()" comment="Skills and technologies" data={serializableSkillData}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skillData.map(({ title, icon: Icon, skills, color = 'green' }) => (
          <div key={title} className="terminal-card p-5">
            {/* Category header */}
            <div className="flex items-center gap-2 mb-4">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="font-mono text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                {'// '}{title}
              </span>
            </div>
            {/* Skill tags */}
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill} className={colorMap[color]}>
                  [{skill}]
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
