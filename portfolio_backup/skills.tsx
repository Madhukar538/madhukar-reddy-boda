import { Badge } from '@/components/ui/badge';
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
import { Card } from '@/components/ui/card';

type SkillCategory = {
  title: string;
  icon: LucideIcon;
  skills: string[];
};

const skillData: SkillCategory[] = [
  {
    title: 'Languages',
    icon: Code2,
    skills: ['C#', 'JavaScript/TypeScript', 'Python', 'C'],
  },
  {
    title: 'Frameworks',
    icon: Server,
    skills: ['.NET (Web Api, MVC, Hybrid)', 'Angular', 'Node.js'],
  },
  {
    title: 'Databases & ORMs',
    icon: Database,
    skills: ['SQL Server', 'ADO.NET', 'Dapper', 'EF Core'],
  },
  {
    title: 'AI/ML',
    icon: BrainCircuit,
    skills: ['RAG', 'NLP', 'OpenCV', 'LangChain'],
  },
  {
    title: 'IoT',
    icon: Router,
    skills: ['Arduino', 'ESP32', 'MQTT', 'Modbus'],
  },
  {
    title: 'Developer Tools',
    icon: Cpu,
    skills: ['VS Code', 'Visual Studio', 'Rider', 'Postman/Insomnia', 'Playwright/Selenium'],
  },
  {
    title: 'Mobile App',
    icon: Smartphone,
    skills: ['React Native (Android & iOS)'],
  },
  {
    title: 'Dashboards',
    icon: AreaChart,
    skills: ['Grafana'],
  },
];

export function Skills() {
  return (
    <Section id="skills" title="Technical Skills">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {skillData.map(({ title, icon: Icon, skills }) => (
          <Card key={title} className="p-6" variant="glass">
            <div className="flex items-center gap-3 mb-4">
              <Icon className="h-6 w-6 text-accent" />
              <h3 className="text-lg font-semibold font-headline text-primary">
                {title}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
