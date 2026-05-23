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
import { Link as LinkIcon } from 'lucide-react';

const keyProjects = [
  {
    title: 'Real-Time IoT Data Platform',
    description: 'Built a .NET system with auto MQTT listener management, Cassandra storage, and fault-tolerant recovery for 24/7 IoT data processing.',
    tech: ['.NET', 'MQTT', 'Cassandra', 'Bg Services', 'Solr'],
  },
  {
    title: 'Custom IntelliSense Extension',
    description: 'Built a Visual Studio plugin to enhance IntelliSense with internal framework awareness, providing smart completions and navigation aids for proprietary codebases.',
    tech: ['Visual Studio Extensibility'],
  },
  {
    title: 'Outlook Reminder Plugin',
    description: 'Developed a lightweight Outlook add-in to schedule contextual follow-ups directly from emails, improving task tracking.',
    tech: ['Office Add-in', 'JavaScript', 'HTML', 'Outlook API'],
  },
  {
    title: 'Modular Video Conferencing System',
    description: 'Engineered a plug-and-play video calling platform supporting multi-user sessions with live signaling and user-state awareness for enterprise systems.',
    tech: ['WebRTC', 'SignalR', 'Angular', 'Node.js', '.NET'],
  },
  {
    title: 'FaceAuth with Liveness Detection',
    description: 'Implemented facial recognition using OpenCV with adjustable thresholding and added spoof-prevention via real-time liveness detection.',
    tech: ['OpenCV', '.NET', 'Angular'],
  },
  {
    title: 'Context-Aware Support Chatbot',
    description: 'Created an NLP-based chatbot to handle ticket creation via dynamic input collection, reducing support workload by automating API calls.',
    tech: ['Python', 'FastAPI', 'LangChain', 'LLM'],
  },
    {
    title: 'Document RAG System',
    description: 'Designed a caching layer using action filters and in-memory persistence to accelerate dashboard data delivery, with configurable TTLs and tiered caching.',
    tech: ['.NET', 'Memory Cache', 'Filters', 'SQL Server'],
  },
    {
    title: 'PWBAssistant NuGet Package',
    description: 'Authored NuGet package (v0.3.0) for advanced, automated table scraping from web pages using Playwright automation.',
    tech: ['NuGet', 'Playwright', '.NET'],
  },
];

const ecommerceProjects = [
    {
        id: 'jockey',
        title: 'JOCKEY (Ecommerce)',
        client: 'Jockey (Page industries ltd, Bangalore)',
        role: 'Software Development Team Member',
        duration: 'Jan 2019 – May 2022',
        url: 'https://www.jockey.in/',
        description: 'Developed features for one of India\'s leading E-commerce portals, contributing to various modules across the platform.',
        responsibilities: [
            'Administrator Facing Application: Developed Order Management, SAP, and HR Mantra modules, plus Return/Refund Automation and reporting.',
            'CRM: Built the user complaint management system to handle the lifecycle of customer issues.',
            'SAP Communication Channel: Developed data sync between the E-commerce app and SAP using web and windows services.',
            'Partner Order Management: Created modules to manage the order process flow for partners.',
            'Interacted with clients, prepared requirement documents, and provided production support.',
            'Managed releases via DevOps and coordinated with the testing team.',
        ],
        tech: ['AngularJs', 'Web API', 'ADO.Net', 'C#', 'ASP.Net', 'SQL Server', 'Solr', 'WCF', 'Windows Services']
    },
    {
        id: 'speedo',
        title: 'Speedo (Ecommerce)',
        client: 'Speedo',
        role: 'Software Development Team Lead',
        duration: 'July 2019 – Jun 2021',
        url: 'https://www.speedo.in/',
        description: 'Led development efforts for the Speedo e-commerce platform, focusing on core administrative and customer-facing features.',
        responsibilities: [
            'Administrator Facing Application: Involved in developing major modules like Order Management and Reports.',
            'CRM: Developed the User complaint management system to raise, process, and close complaints.',
            'Partner Order Management: Developed a module to maintain the order process flow.',
            'Understood client requirements and provided production support.',
            'Coordinated with testing teams and prepared release notes for UAT and Production deployments.',
        ],
        tech: ['AngularJs', 'Web API', 'ADO.Net', 'C#', 'ASP.Net', 'SQL Server', 'Solr', 'WCF', 'Windows Services']
    },
    {
        id: 'manyavar',
        title: 'Manyavar (Ecommerce)',
        client: 'Vedant Fashion Limited',
        role: 'Software Development Team Member',
        duration: 'Jun 2021 – Jan 2022',
        url: 'https://www.manyavar.com/',
        description: 'Contributed to the development of the Manyavar e-commerce site, a major platform in the ethnic wear market.',
        responsibilities: [
            'Focused on backend development for the Administrator-facing CMS.',
            'Contributed to various modules to enhance the platform\'s functionality and performance.',
            'Worked within a team to deliver features for a high-traffic e-commerce website.',
        ],
        tech: ['AngularJs', 'Web API', 'ADO.Net', 'C#', 'ASP.Net', 'SQL Server', 'Solr', 'WCF', 'Windows Services']
    },
];

export function Projects() {
  return (
    <Section id="projects" title="Projects">
      <div>
        <h3 className="mb-6 text-2xl font-bold text-center text-primary/90 font-headline">
          Key Projects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keyProjects.map((project) => (
            <Card
              key={project.title}
              variant="glass"
              className="flex flex-col transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl"
            >
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <h3 className="mb-6 text-2xl font-bold text-center text-primary/90 font-headline">
          E-commerce Experience
        </h3>
        <Card variant="glass">
            <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto">
                {ecommerceProjects.map((project) => (
                    <AccordionItem value={project.id} key={project.id}>
                        <AccordionTrigger className="text-lg font-semibold hover:text-accent font-headline px-6">
                            {project.title}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="p-6 rounded-b-lg pt-2">
                               <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
                                    <p><strong className="text-primary">Client:</strong> {project.client}</p>
                                    <p><strong className="text-primary">Role:</strong> {project.role}</p>
                                    <p><strong className="text-primary">Duration:</strong> {project.duration}</p>
                               </div>
                               <p className="mb-4 text-muted-foreground">{project.description}</p>
                               <ul className="mb-4 list-disc space-y-2 pl-5 text-sm">
                                   {project.responsibilities.map((item, index) => <li key={index}>{item}</li>)}
                               </ul>
                               <div className="flex flex-wrap gap-2 mb-4">
                                   {project.tech.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                               </div>
                               <a href={project.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-accent hover:underline">
                                   Visit Website <LinkIcon className="ml-2 h-4 w-4" />
                               </a>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </Card>
      </div>
    </Section>
  );
}
