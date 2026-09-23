'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { Section } from '@/components/portfolio/section';
import { cn } from '@/lib/utils';

type Status = 'SHIPPED' | 'WIP' | 'POC' | 'RESEARCH';

type Experiment = {
  title: string;
  description: string;
  tech: string[];
  status: Status;
  /** Slug of a blog post that writes this experiment up in depth. */
  post?: string;
};

// Newest work first.
export const rdProjects: Experiment[] = [
  {
    title: 'Hybrid Product Search (BM25 + Vector + RRF)',
    description: 'Solr 9 engine fusing keyword and kNN vector results with Reciprocal Rank Fusion. In-process ONNX embeddings, rule-based NLU over a live catalog vocabulary, typo tolerance, price parsing and multi-item queries.',
    tech: ['Solr 9', 'ONNX Runtime', 'MiniLM', 'RRF', '.NET'],
    status: 'POC',
    post: 'hybrid-search-solr-bm25-vector-rrf',
  },
  {
    title: 'Multi-Tenant RAG Chatbot Platform',
    description: 'Embeddable AI assistant: SignalR streaming, pgvector retrieval, a text-to-SQL agent, MCP tools, episodic memory, per-workspace PII masking and an async RabbitMQ ingestion pipeline.',
    tech: ['.NET 10', 'Semantic Kernel', 'pgvector', 'RabbitMQ', 'Next.js'],
    status: 'WIP',
    post: 'rag-chatbot-latency-audit',
  },
  {
    title: 'On-Demand ISR: Next.js 16 + .NET',
    description: 'Static pages with zero API calls per view, kept fresh by signed webhooks from .NET that expire exact cache tags. Handles new and deleted pages without a rebuild.',
    tech: ['Next.js 16', 'ASP.NET Core', 'ISR', 'Webhooks'],
    status: 'POC',
    post: 'nextjs-dotnet-on-demand-isr',
  },
  {
    title: 'MCP Server for Code & Database Intelligence',
    description: '.NET Model Context Protocol server exposing database schema extraction, code analysis and TFS work items as AI tools, with background metadata sync to MongoDB and a Blazor admin dashboard.',
    tech: ['MCP', '.NET', 'MongoDB', 'Blazor'],
    status: 'WIP',
  },
  {
    title: 'Uptime & Incident Platform on Uptime Kuma',
    description: 'Uptime Kuma kept as a headless check engine behind a custom .NET API and React admin UI: incidents, maintenance windows, FCM push alerts, flapping suppression, self-healing hooks and ticketing.',
    tech: ['Uptime Kuma', '.NET 10', 'React Router', 'Socket.IO', 'Docker'],
    status: 'WIP',
  },
  {
    title: 'Offline-First Field Inspection App',
    description: 'One storage interface over native Android SQLite and browser IndexedDB, with master-data sync and a transactional outbox that replays queued actions when connectivity returns.',
    tech: ['TypeScript', 'SQLite', 'IndexedDB', 'Android', 'Sync'],
    status: 'WIP',
  },
  {
    title: 'Self-Hosted Web Analytics',
    description: 'Google Analytics replacement for an e-commerce site: a drop-in JS tracker, ASP.NET Core ingestion API, ClickHouse event store and Grafana dashboards, with natural-language querying planned.',
    tech: ['ClickHouse', 'ASP.NET Core', 'Grafana', 'JavaScript'],
    status: 'POC',
  },
  {
    title: 'MongoDB Query Tuning for a Meeting Platform',
    description: 'Compound and unique indexes on the conversations collection turned full collection scans into index scans. User-conversation queries dropped from 500–2000 ms to 5–50 ms.',
    tech: ['MongoDB', 'Indexing', 'Performance'],
    status: 'SHIPPED',
  },
  {
    title: 'Voice / IVR Agent over RAG',
    description: 'Fully self-hosted voice loop in front of the existing chatbot: Silero VAD, streaming whisper.cpp, Piper TTS and Pipecat orchestration, with Asterisk for SIP telephony.',
    tech: ['Pipecat', 'whisper.cpp', 'Piper', 'Asterisk'],
    status: 'RESEARCH',
  },
  {
    title: 'In-Browser LLM Inference with WebLLM',
    description: 'Run small models (Qwen2.5 1.5B, Phi-3 mini, SmolLM2) in the browser via WebGPU as a "local mode" for the chatbot, optionally grounded by backend vector search.',
    tech: ['WebLLM', 'WebGPU', 'Next.js'],
    status: 'RESEARCH',
  },
  {
    title: 'Image & Table Extraction with Document AI',
    description: 'Proofs of concept extracting structured data from scanned documents: Google Document AI table parsing in .NET, and a Gemini vision-model web app with a Next.js front end.',
    tech: ['Document AI', 'Gemini VLM', '.NET', 'Next.js'],
    status: 'POC',
  },
  {
    title: '10-Node Bare-Metal "VMSS" Cluster',
    description: 'Design for a VMSS-style cluster on ten 8 GB mini PCs: Proxmox, NFS shared storage and Docker Swarm now, with a path to K3s once autoscaling is needed.',
    tech: ['Proxmox', 'Docker Swarm', 'K3s', 'NFS'],
    status: 'RESEARCH',
    post: 'homelab-vmss-docker-swarm-vs-k3s',
  },
  {
    title: 'Legacy jQuery Site → Next.js Static Export',
    description: 'Lift-and-shift of a jQuery + jsrender site into Next.js with output: export, keeping the CSS, behaviour and URLs byte-identical, converted in parallel page batches.',
    tech: ['Next.js', 'jQuery', 'Static Export', 'IIS'],
    status: 'WIP',
  },
  {
    title: 'Custom Roslyn Analyzer',
    description: 'Build-time C# diagnostics enforcing house rules: no Console.WriteLine in favour of a logger, camelCase locals and a null-check heuristic.',
    tech: ['Roslyn', 'C#', '.NET 8'],
    status: 'POC',
  },
  {
    title: 'API Load Testing & Observability',
    description: 'Designed repeatable k6 suites for critical APIs wired into Grafana dashboards to validate SLAs and guide capacity planning.',
    tech: ['k6', 'Grafana', 'InfluxDB', 'SLA'],
    status: 'SHIPPED',
    post: 'load-testing-microservices-k6-grafana',
  },
  {
    title: 'PDF Generation from HTML in C#',
    description: 'Production solution for generating PDFs from HTML using PuppeteerSharp and iTextSharp with pixel-accurate rendering.',
    tech: ['C#', 'PuppeteerSharp', 'iTextSharp'],
    status: 'SHIPPED',
  },
  {
    title: 'AI Code Review Assistant',
    description: 'CI/CD-integrated tool using a custom LLM to review PRs for quality, style and potential bugs, cutting manual review time by 30%.',
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
    description: 'RAG pipeline for internal docs: developers query in natural language and get precise answers with source links.',
    tech: ['RAG', 'LangChain', 'Vector DB', 'Transformers'],
    status: 'SHIPPED',
    post: 'building-rag-pipeline-internal-documentation',
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
