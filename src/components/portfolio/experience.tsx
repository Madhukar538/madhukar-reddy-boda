'use client';

import { Briefcase } from 'lucide-react';
import { Section } from '@/components/portfolio/section';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const experienceData = {
  title: 'Software Architect',
  company: 'Revalsys Technologies',
  duration: '2021–Present · Hyderabad, IN',
  highlights: [
    'Performance: k6 + Grafana load suites to validate SLAs and capacity; tuned APIs and caches.',
    'Architecture: Modernized .NET hybrid stacks, observability-first designs, and AI workflow integrations.',
    'Delivery: Led R&D and PoCs across IoT, AI assistants, RDLC workflow tooling, and debugging utilities.',
  ],
  responsibilities: [
    'Led .NET-based R&D projects for rapid prototyping and system innovation.',
    'Assisted in migrating legacy systems to modern .NET hybrid architectures.',
    'Integrated AI/ML workflows to enhance automation and insights.',
    'Built PoCs for IoT, debugging tools, and context-aware assistants.',
    'Developed document processing solutions and handled integrations.',
    'Adopted high-performance architecture for existing projects.',
    'Built an internal Code reviewing tool to improve code quality.',
    'Created an RDLC Application for internal workflow processes, streamlining development from requirement to end-user.',
    'Worked on ONDC (Open Network for Digital Commerce) Integration.',
    'Ecommerce projects: Jockey, Speedo, Manyavar, and more.',  
    'RevalERP - An ERP system for managing business processes, including finance, HR, and supply chain.',
    'RevalHRM - A Human Resource Management System for managing employee data, payroll, and performance.',
    'RevalCRM - A Customer Relationship Management system for managing customer interactions and sales processes.',
    'RevalCMS - A Content Management System for managing website content and digital assets.',
    'RevalPOS - A Point of Sale system for managing retail transactions and inventory.',
    'RevalInventory - An Inventory Management system for tracking stock levels and orders.',
    'RevalProject - A Project Management system for planning, executing, and monitoring projects.',
    'RevalSales - A Sales Management system for managing sales processes and customer relationships.',
    'Reval Meet - A Video calling system for managing online meetings and conferences.',
  ],
};

export function Experience() {
  return (
    <Section id="experience" title="Work Experience">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_15%_20%,#60a5fa_0,transparent_28%),radial-gradient(circle_at_90%_10%,#22d3ee_0,transparent_24%)]" />
        <div className="relative px-5 py-10 md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary shadow-sm">
                <Briefcase className="h-4 w-4 text-accent" />
                {experienceData.duration}
              </div>
              <h3 className="text-3xl font-extrabold font-headline text-primary leading-tight">
                {experienceData.title}
              </h3>
              <p className="text-lg font-semibold text-muted-foreground">{experienceData.company}</p>
            </div>
            <Badge className="self-start rounded-full border border-accent bg-background/80 px-4 py-2 text-xs font-semibold text-accent shadow-sm">
              Full-time
            </Badge>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {experienceData.highlights.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>

          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.04 } },
            }}
            className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            {experienceData.responsibilities.map((item, index) => (
              <motion.li
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group relative rounded-2xl border border-border/50 bg-background/60 p-4 text-sm leading-relaxed shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg"
              >
                <span className="absolute left-3 top-4 h-2 w-2 rounded-full bg-gradient-to-tr from-accent to-primary/80 opacity-80" />
                <span className="pl-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  {item}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </Section>
  );
}
