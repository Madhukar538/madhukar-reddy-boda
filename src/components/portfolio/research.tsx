import { Section } from '@/components/portfolio/section';
import { FlaskConical } from 'lucide-react';

const rdProjects = [
  {
    title: 'API Load Testing & Observability',
    description: 'Designed repeatable k6 suites for critical APIs wired into Grafana dashboards to validate SLAs and guide capacity planning.',
    tech: ['k6', 'Grafana', 'InfluxDB', 'SLA'],
    status: 'SHIPPED',
  },
  {
    title: 'PDF Generation from HTML in C#',
    description: 'Production solution for generating PDFs from HTML using PuppeteerSharp and iTextSharp with pixel-accurate rendering.',
    tech: ['C#', 'PuppeteerSharp', 'iTextSharp'],
    status: 'SHIPPED',
  },
  {
    title: 'AI Code Review Assistant',
    description: 'CI/CD-integrated tool using custom LLM to review PRs for quality, style, and potential bugs — 30% reduction in manual review time.',
    tech: ['LLM', 'FastAPI', 'Python', 'Docker', 'CI/CD'],
    status: 'SHIPPED',
  },
  {
    title: 'IoT Predictive Maintenance PoC',
    description: 'Industrial IoT PoC predicting equipment failures via sensor data + ML using MQTT ingestion and .NET backend analysis.',
    tech: ['IoT', '.NET', 'MQTT', 'ML', 'Azure'],
    status: 'POC',
  },
  {
    title: 'Advanced RAG for Internal Docs',
    description: 'RAG pipeline for internal docs — developers query in natural language, receive precise answers with source links.',
    tech: ['RAG', 'LangChain', 'Vector DB', 'Transformers'],
    status: 'SHIPPED',
  },
  {
    title: 'End-to-End Encryption Layer',
    description: 'Document sharing system with E2EE ensuring only authorized users access sensitive data via secure cryptographic protocols.',
    tech: ['E2EE', 'Cryptography', 'Secure Protocols'],
    status: 'POC',
  },
  {
    title: 'RabbitMQ Microservices Bus',
    description: 'Async messaging layer using RabbitMQ for reliable service-to-service communication with dead-letter queues and retries.',
    tech: ['RabbitMQ', 'Microservices', 'Docker'],
    status: 'SHIPPED',
  },
  {
    title: 'gRPC Service Mesh',
    description: 'High-performance inter-service communication using gRPC with Protocol Buffers for strongly-typed microservice contracts.',
    tech: ['gRPC', 'Protobuf', 'Docker'],
    status: 'POC',
  },
];

const statusColor: Record<string, string> = {
  SHIPPED: 'text-primary border-primary/30 bg-primary/5',
  POC: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  WIP: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
};

export function Research() {
  return (
    <Section id="research" title="lab_experiments()" comment="R&D projects and explorations">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rdProjects.map((project) => (
          <div key={project.title} className="terminal-card p-5 group">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                <span className="font-mono text-xs text-yellow-400/80 font-semibold uppercase tracking-wide">
                  [EXPERIMENT]
                </span>
              </div>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm border font-semibold ${statusColor[project.status]}`}>
                {project.status}
              </span>
            </div>
            <h3 className="font-mono text-sm font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <span key={t} className="code-tag code-tag-amber">[{t}]</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
