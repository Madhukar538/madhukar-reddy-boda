'use client';

import { Briefcase, Calendar, MapPin } from 'lucide-react';
import { Section } from '@/components/portfolio/section';
import { motion } from 'framer-motion';

const experienceData = {
  title: 'Software Architect',
  company: 'Revalsys Technologies',
  duration: '2021 – Present',
  location: 'Hyderabad, IN',
  type: 'Full-time',
  highlights: [
    { label: 'Performance', value: 'k6 + Grafana suites · validated SLAs · capacity planning' },
    { label: 'AI platforms', value: 'Multi-tenant RAG · MCP servers · hybrid vector search · self-hosted LLMs' },
    { label: 'Architecture', value: 'Modernized .NET stacks · offline-first apps · observability-first' },
  ],
  responsibilities: [
    'Architecting a multi-tenant RAG chatbot platform on .NET 10: Semantic Kernel agents, pgvector, text-to-SQL, MCP tools, PII guardrails and SignalR streaming.',
    'Built an MCP (Model Context Protocol) server exposing database schemas, code analysis and TFS work items as AI tools.',
    'Designed a hybrid product search engine on Solr 9 fusing BM25 and vector kNN results with Reciprocal Rank Fusion.',
    'Building an offline-first procurement and inspection app (Next.js PWA + Android SQLite) with outbox-based sync.',
    'Building an uptime and incident-management platform on Uptime Kuma with a .NET API, push alerts and ticketing.',
    'Run AI workloads on self-hosted LLMs (Ollama on an in-house GPU server), with no cloud AI dependency.',
    'Tuned MongoDB indexes for the meeting platform, cutting conversation queries from 500–2000 ms to 5–50 ms.',
    'Led .NET-based R&D projects for rapid prototyping and system innovation.',
    'Migrated legacy systems to modern .NET hybrid architectures.',
    'Integrated AI/ML workflows — NLP chatbots, RAG systems, code review automation.',
    'Built PoCs for IoT (MQTT), debugging tools, and context-aware assistants.',
    'Developed document processing and complex third-party integration pipelines.',
    'Built internal Code Review tool — reduced PR cycle time by 30%.',
    'Created RDLC Application for internal workflow, end-to-end requirement to delivery.',
    'Led ONDC (Open Network for Digital Commerce) integration.',
    'E-commerce: Jockey, Speedo, Manyavar, LuxCozi (Angular + .NET).',
    'RevalERP · RevalHRM · RevalCRM · RevalCMS · RevalPOS · RevalInventory · RevalProject · RevalSales.',
    'Reval Meet — video conferencing platform (WebRTC + SignalR + Node.js).',
  ],
};

export function Experience() {
  return (
    <Section id="experience" title="Current Role" comment="2021 – Present" data={experienceData}>
      <div className="glass p-6 md:p-8">
        {/* Role header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-8px_hsl(var(--primary)/0.7)]">
            <Briefcase className="h-5 w-5" />
          </span>
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">{experienceData.title}</h3>
              <span className="chip chip-accent">{experienceData.type}</span>
            </div>
            <p className="text-[15px] font-medium text-foreground/80">{experienceData.company}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{experienceData.duration}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{experienceData.location}</span>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="mb-7 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {experienceData.highlights.map(({ label, value }) => (
            <div key={label} className="glass-inset p-4">
              <p className="text-sm font-semibold text-primary mb-1">{label}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{value}</p>
            </div>
          ))}
        </div>

        {/* Responsibilities */}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Key contributions
        </p>
        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          className="space-y-2.5"
        >
          {experienceData.responsibilities.map((item, idx) => (
            <motion.li
              key={idx}
              variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
              className="flex items-start gap-3"
            >
              <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-[15px] text-foreground/80 leading-relaxed">{item}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </Section>
  );
}
