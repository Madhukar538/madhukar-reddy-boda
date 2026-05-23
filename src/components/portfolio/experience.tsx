'use client';

import { Briefcase, ChevronRight } from 'lucide-react';
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
    { label: 'Architecture', value: 'Modernized .NET stacks · observability-first · AI integrations' },
    { label: 'Delivery',     value: 'Led R&D PoCs across IoT, AI assistants, RDLC tooling' },
  ],
  responsibilities: [
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
    <Section id="experience" title="work_log()" comment="Professional experience" data={experienceData}>
      <div className="terminal-card">
        {/* Terminal window chrome */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 font-mono text-xs text-muted-foreground">work_log.json</span>
        </div>

        <div className="px-5 md:px-8 py-6">
          {/* Job header — terminal output style */}
          <div className="mb-6 space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex items-center gap-2">
                <span className="text-primary font-mono text-xs">$</span>
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h3 className="font-mono text-lg font-bold text-foreground">
                {experienceData.title}
              </h3>
              <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20">
                {experienceData.type}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted-foreground pl-6">
              <span className="text-foreground/70">{experienceData.company}</span>
              <span>{'>'} {experienceData.duration}</span>
              <span>{'>'} {experienceData.location}</span>
            </div>
          </div>

          {/* Highlights — structured key-value */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            {experienceData.highlights.map(({ label, value }) => (
              <div key={label} className="bg-background/60 border border-border rounded-sm p-3">
                <p className="font-mono text-xs text-primary mb-1">{'// '}{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{value}</p>
              </div>
            ))}
          </div>

          {/* Responsibilities — terminal list */}
          <div>
            <p className="font-mono text-xs text-muted-foreground/60 mb-3">
              {'// responsibilities[]'}
            </p>
            <motion.ul
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
              className="space-y-2"
            >
              {experienceData.responsibilities.map((item, idx) => (
                <motion.li
                  key={idx}
                  variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                  className="flex items-start gap-2.5 group"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors leading-relaxed">
                    {item}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
