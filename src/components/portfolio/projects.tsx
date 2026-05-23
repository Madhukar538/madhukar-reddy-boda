import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Section } from '@/components/portfolio/section';
import { portfolio as fossilIndiaPortfolio } from './fossil-india';

type FossilIndiaFeature = {
  name: string;
  details: string[];
};
type FossilIndiaChallenge = {
  challenge: string;
  solution: string;
};
type FossilIndiaProject = {
  title: string;
  doneUsing: string;
  overview: string;
  techStack: string[];
  features: FossilIndiaFeature[];
  performance: string[];
  security: string[];
  challenges: FossilIndiaChallenge[];
  impact: string[];
};
import { Link as LinkIcon } from 'lucide-react';

const keyProjects = [
  {
    title: 'Real-Time IoT Data Platform',
    description:
      'Built a .NET system with auto MQTT listener management, Cassandra storage, and fault-tolerant recovery for 24/7 IoT data processing.',
    tech: ['.NET', 'MQTT', 'Cassandra', 'Bg Services', 'Solr'],
  },
  {
    title: 'Custom IntelliSense Extension',
    description:
      'Built a Visual Studio plugin to enhance IntelliSense with internal framework awareness, providing smart completions and navigation aids for proprietary codebases.',
    tech: ['Visual Studio Extensibility'],
  },
  {
    title: 'Outlook Reminder Plugin',
    description:
      'Developed a lightweight Outlook add-in to schedule contextual follow-ups directly from emails, improving task tracking.',
    tech: ['Office Add-in', 'JavaScript', 'HTML', 'Outlook API'],
  },
  {
    title: 'Modular Video Conferencing System',
    description:
      'Engineered a plug-and-play video calling platform supporting multi-user sessions with live signaling and user-state awareness for enterprise systems.',
    tech: ['WebRTC', 'SignalR', 'Angular', 'Node.js', '.NET'],
  },
  {
    title: 'FaceAuth with Liveness Detection',
    description:
      'Implemented facial recognition using OpenCV with adjustable thresholding and added spoof-prevention via real-time liveness detection.',
    tech: ['OpenCV', '.NET', 'Angular'],
  },
  {
    title: 'Context-Aware Support Chatbot',
    description:
      'Created an NLP-based chatbot to handle ticket creation via dynamic input collection, reducing support workload by automating API calls.',
    tech: ['Python', 'FastAPI', 'LangChain', 'LLM'],
  },
  {
    title: 'Document RAG System',
    description:
      'Designed a caching layer using action filters and in-memory persistence to accelerate dashboard data delivery, with configurable TTLs and tiered caching.',
    tech: ['.NET', 'Memory Cache', 'Filters', 'SQL Server'],
  },
  {
    title: 'PWBAssistant NuGet Package',
    description:
      'Authored NuGet package (v0.3.0) for advanced, automated table scraping from web pages using Playwright automation.',
    tech: ['NuGet', 'Playwright', '.NET'],
  },
];

const ecommerceProjects = [
  {
    id: 'jockey',
    title: 'JOCKEY (Ecommerce)',
    client: 'Jockey (Page industries ltd, Bangalore)',
    role: 'Software Development Team Lead',
    duration: 'Jan 2021 – May 2023',
    url: 'https://www.jockey.in/',
    description:
      "Developed features for one of India's leading E-commerce portals, contributing to various modules across the platform.",
    responsibilities: [
      'Administrator Facing Application: Developed Order Management, SAP, and HR Mantra modules, plus Return/Refund Automation and reporting.',
      'CRM: Built the user complaint management system to handle the lifecycle of customer issues.',
      'SAP Communication Channel: Developed data sync between the E-commerce app and SAP using web and windows services.',
      'Partner Order Management: Created modules to manage the order process flow for partners.',
      'Interacted with clients, prepared requirement documents, and provided production support.',
      'Managed releases via DevOps and coordinated with the testing team.',
    ],
    tech: [
      'AngularJs',
      'Web API',
      'ADO.Net',
      'C#',
      'ASP.Net',
      'SQL Server',
      'Solr',
      'WCF',
      'Windows Services',
    ],
  },
  {
    id: 'speedo',
    title: 'Speedo (Ecommerce)',
    client: 'Speedo',
    role: 'Software Development Team Lead',
    duration: 'July 2019 – Jun 2021',
    url: 'https://www.speedo.in/',
    description:
      'Led development efforts for the Speedo e-commerce platform, focusing on core administrative and customer-facing features.',
    responsibilities: [
      'Administrator Facing Application: Involved in developing major modules like Order Management and Reports.',
      'CRM: Developed the User complaint management system to raise, process, and close complaints.',
      'Partner Order Management: Developed a module to maintain the order process flow.',
      'Understood client requirements and provided production support.',
      'Coordinated with testing teams and prepared release notes for UAT and Production deployments.',
    ],
    tech: [
      'AngularJs',
      'Web API',
      'ADO.Net',
      'C#',
      'ASP.Net',
      'SQL Server',
      'Solr',
      'WCF',
      'Windows Services',
    ],
  },
  {
    id: 'manyavar',
    title: 'Manyavar (Ecommerce)',
    client: 'Vedant Fashion Limited',
    role: 'Software Development Team Member',
    duration: 'Jun 2021 – Jan 2022',
    url: 'https://www.manyavar.com/',
    description:
      "Contributed to the development of the Manyavar e-commerce site, a major platform in the ethnic wear market.",
    responsibilities: [
      'Focused on backend development for the Administrator-facing CMS.',
      "Contributed to various modules to enhance the platform's functionality and performance.",
      'Worked within a team to deliver features for a high-traffic e-commerce website.',
    ],
    tech: [
      'AngularJs',
      'Web API',
      'ADO.Net',
      'C#',
      'ASP.Net',
      'SQL Server',
      'Solr',
      'WCF',
      'Windows Services',
    ],
  },
  {
    id: 'LuxCozi',
    title: 'LuxCozi (Ecommerce)',
    client: 'LuxCozi',
    role: 'Software Development Team Lead',
    duration: 'Jun 2021 – Jan 2022',
    url: 'https://www.luxcozi.com/',
    description:
      "Contributed to the development of the LuxCozi e-commerce site, a major platform in the ethnic wear market.",
    responsibilities: [
      'Focused on backend development for the Administrator-facing CMS.',
      "Contributed to various modules to enhance the platform's functionality and performance.",
      'Worked within a team to deliver features for a high-traffic e-commerce website.',
    ],
    tech: [
      'AngularJs',
      'Web API',
      'ADO.Net',
      'C#',
      'ASP.Net',
      'SQL Server',
      'Solr',
      'WCF',
      'Windows Services',
    ],
  },
  {
    id: 'fossil-india',
    title: 'Fossil India (Storefront Migration)',
    client: 'Fossil India',
    role: 'Lead Architect (Migration)',
    duration: '2023 – 2024',
    url: '#',
    description:
      'Led migration from Angular to Next.js with focus on performance, security, and feature parity.',
    responsibilities: [
      'Defined migration strategy and phased rollout for minimal disruption.',
      'Implemented performance optimizations (lazy hydration, dynamic imports, image and font optimizations).',
      'Established nonce-based CSP and secure headers for production environments.',
      'Coordinated SEO, metadata mapping and QA verification for organic ranking preservation.',
    ],
    tech: ['Next.js', 'React', 'TypeScript', 'CSS Modules', 'Bootstrap', 'react-slick'],
  },
];

export function Projects() {
  const combined = [
    ...(fossilIndiaPortfolio as FossilIndiaProject[]).map((p) => ({
      title: p.title,
      description: p.overview,
      tech: p.techStack,
    })),
    ...keyProjects,
  ];

  return (
    <Section id="projects" title="architected_systems()" comment="Key projects and e-commerce builds">
      {/* Key projects grid */}
      <div className="mb-3 font-mono text-xs text-muted-foreground/60">
        {'// key_projects[] — systems built from scratch'}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {combined.map((project, idx) => (
          <div key={project.title} className="terminal-card p-5 flex flex-col group">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-primary/60">
                  [{String(idx + 1).padStart(2, '0')}]
                </span>
              </div>
            </div>
            <h3 className="font-mono text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 mb-2 leading-snug">
              {project.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {project.tech.map((tech) => (
                <span key={tech} className="code-tag code-tag-cyan">[{tech}]</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* E-commerce accordion */}
      <div className="mb-3 font-mono text-xs text-muted-foreground/60">
        {'// ecommerce_experience[] — client portals and integrations'}
      </div>
      <div className="terminal-card overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          {ecommerceProjects.map((project) => (
            <AccordionItem
              value={project.id}
              key={project.id}
              className="border-b border-border last:border-0"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline group">
                <div className="flex items-center gap-3 text-left">
                  <span className="font-mono text-[10px] text-primary/60 shrink-0">$</span>
                  <span className="font-mono text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {project.title}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground hidden sm:block">
                    {project.duration}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-5 pb-5 pt-1 space-y-4">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted-foreground">
                    <span><span className="text-primary/80">client:</span> {project.client}</span>
                    <span><span className="text-primary/80">role:</span> {project.role}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                  <ul className="space-y-1.5">
                    {project.responsibilities.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
                        <span className="text-primary mt-0.5 shrink-0">›</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.tech.map((t) => (
                      <span key={t} className="code-tag">[{t}]</span>
                    ))}
                  </div>
                  {project.url !== '#' && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <LinkIcon className="h-3 w-3" />
                      visit_site()
                    </a>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
