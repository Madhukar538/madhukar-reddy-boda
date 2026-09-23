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
    skills: ['C#', 'TypeScript', 'JavaScript', 'Python', 'SQL', 'C'],
  },
  {
    title: 'Backend',
    icon: Server,
    color: 'cyan',
    skills: ['.NET 10 / ASP.NET Core', 'Web API & MVC', 'Background & Worker Services', 'Blazor', 'Node.js', 'FastAPI'],
  },
  {
    title: 'Frontend & Mobile',
    icon: Layout,
    color: 'amber',
    skills: ['Next.js 16 (App Router, ISR)', 'React 19', 'Angular', 'Tailwind CSS', 'React Native', 'Offline-first PWA'],
  },
  {
    title: 'AI & LLMs',
    icon: BrainCircuit,
    color: 'green',
    skills: ['RAG', 'Semantic Kernel', 'MCP (Model Context Protocol)', 'Ollama · Qwen3 · Gemma', 'LiteLLM', 'mem0', 'LangChain', 'ONNX Runtime', 'Gemini VLM', 'Document AI', 'WebLLM', 'whisper.cpp · Piper', 'OpenCV'],
  },
  {
    title: 'Search & Vectors',
    icon: Search,
    color: 'cyan',
    skills: ['Solr 9 (kNN, Suggester, MLT)', 'Hybrid BM25 + Vector (RRF)', 'pgvector', 'Qdrant', 'Embeddings'],
  },
  {
    title: 'Data & Caching',
    icon: Database,
    color: 'amber',
    skills: ['SQL Server', 'PostgreSQL', 'MongoDB', 'ClickHouse', 'SQLite · IndexedDB', 'Redis', 'Memcached', 'EF Core', 'Dapper', 'ADO.NET'],
  },
  {
    title: 'Messaging & Realtime',
    icon: Radio,
    color: 'green',
    skills: ['RabbitMQ', 'SignalR', 'gRPC', 'MQTT', 'WebRTC', 'Socket.IO', 'Firebase (FCM)'],
  },
  {
    title: 'DevOps & Infrastructure',
    icon: Container,
    color: 'cyan',
    skills: ['Docker', 'Docker Swarm', 'K3s', 'Proxmox', 'Coolify', 'Cloudflare Tunnel', 'Terraform', 'Azure', 'Azure DevOps / TFS', 'IIS'],
  },
  {
    title: 'Observability & Quality',
    icon: Gauge,
    color: 'amber',
    skills: ['k6', 'Grafana', 'Uptime Kuma', 'Load Testing & SLAs', 'Playwright', 'Roslyn Analyzers', 'Postman'],
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
