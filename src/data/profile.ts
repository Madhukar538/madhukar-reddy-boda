/**
 * Single source of truth for portfolio content.
 * Used by the web pages and by the generated résumé PDF (/resume.pdf),
 * so the two never drift apart. Keep this file free of React/UI imports.
 */

export const profile = {
  name: 'Boda Madhukar Reddy',
  title: 'Software Architect',
  company: 'Revalsys Technologies',
  location: 'Hyderabad, India',
  email: 'madhukarreddyboda538@gmail.com',
  phone: '+91 95731 53479',
  phoneHref: 'tel:+919573153479',
  github: 'https://github.com/Madhukar538',
  // Full profile URLs. Left empty, the icon is hidden rather than linking to a site's home page.
  linkedin: '',
  twitter: '',
  summary:
    'Backend-focused Software Architect with 5+ years building, optimizing and scaling high-traffic systems and self-hosted AI platforms. ' +
    'Designs high-throughput .NET APIs, multi-tenant RAG and MCP platforms and hybrid search, and validates everything with k6 + Grafana. ' +
    'Production-first: diagnose fast, fix right, prevent recurrence.',
};

/** Social profiles that are filled in, for icon rows on the site. */
export const socialLinks = (
  [
    { network: 'GitHub', href: profile.github },
    { network: 'LinkedIn', href: profile.linkedin },
    { network: 'Twitter', href: profile.twitter },
  ] as const
).filter((link) => link.href);

export type SkillCategory = {
  title: string;
  skills: string[];
  color?: 'green' | 'cyan' | 'amber';
};

export const skillCategories: SkillCategory[] = [
  {
    title: 'Languages',
    color: 'green',
    skills: ['C#', 'TypeScript', 'JavaScript', 'Python', 'SQL', 'C'],
  },
  {
    title: 'Backend',
    color: 'cyan',
    skills: ['.NET 10 / ASP.NET Core', 'Web API & MVC', 'Background & Worker Services', 'Blazor', 'Node.js', 'FastAPI'],
  },
  {
    title: 'Frontend & Mobile',
    color: 'amber',
    skills: ['Next.js 16 (App Router, ISR)', 'React 19', 'Angular', 'Tailwind CSS', 'React Native', 'Offline-first PWA'],
  },
  {
    title: 'AI & LLMs',
    color: 'green',
    skills: ['RAG', 'Semantic Kernel', 'MCP (Model Context Protocol)', 'Ollama · Qwen3 · Gemma', 'LiteLLM', 'mem0', 'LangChain', 'ONNX Runtime', 'Gemini VLM', 'Document AI', 'WebLLM', 'whisper.cpp · Piper', 'OpenCV'],
  },
  {
    title: 'Search & Vectors',
    color: 'cyan',
    skills: ['Solr 9 (kNN, Suggester, MLT)', 'Hybrid BM25 + Vector (RRF)', 'pgvector', 'Qdrant', 'Embeddings'],
  },
  {
    title: 'Data & Caching',
    color: 'amber',
    skills: ['SQL Server', 'PostgreSQL', 'MongoDB', 'ClickHouse', 'SQLite · IndexedDB', 'Redis', 'Memcached', 'EF Core', 'Dapper', 'ADO.NET'],
  },
  {
    title: 'Messaging & Realtime',
    color: 'green',
    skills: ['RabbitMQ', 'SignalR', 'gRPC', 'MQTT', 'WebRTC', 'Socket.IO', 'Firebase (FCM)'],
  },
  {
    title: 'DevOps & Infrastructure',
    color: 'cyan',
    skills: ['Docker', 'Docker Swarm', 'K3s', 'Proxmox', 'Coolify', 'Cloudflare Tunnel', 'Terraform', 'Azure', 'Azure DevOps / TFS', 'IIS'],
  },
  {
    title: 'Observability & Quality',
    color: 'amber',
    skills: ['k6', 'Grafana', 'Uptime Kuma', 'Load Testing & SLAs', 'Playwright', 'Roslyn Analyzers', 'Postman'],
  },
];

export const experience = {
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
  groups: [
    {
      label: 'AI platforms',
      items: [
        'Architecting a multi-tenant RAG chatbot platform on .NET 10: Semantic Kernel agents, pgvector, text-to-SQL, MCP tools, PII guardrails and SignalR streaming.',
        'Built an MCP (Model Context Protocol) server that gives AI assistants a map of C# codebases and SQL Server schemas: Roslyn code analysis and schema extraction synced to MongoDB, exposed as 40+ tools.',
        'Designed a hybrid product search engine on Solr 9 fusing BM25 and vector kNN results with Reciprocal Rank Fusion.',
        'Run AI workloads on self-hosted LLMs (Ollama on an in-house GPU server), with no cloud AI dependency.',
        'Integrated AI/ML workflows — NLP chatbots, RAG systems, code review automation.',
      ],
    },
    {
      label: 'Performance & tooling',
      items: [
        'Tuned MongoDB indexes for the meeting platform, cutting conversation queries from 500–2000 ms to 5–50 ms.',
        'Built internal Code Review tool — reduced PR cycle time by 30%.',
        'Developed document processing and complex third-party integration pipelines.',
      ],
    },
    {
      label: 'Architecture & R&D',
      items: [
        'Building an offline-first procurement and inspection app (Next.js PWA + Android SQLite) with outbox-based sync.',
        'Building an uptime and incident-management platform on Uptime Kuma with a .NET API, push alerts and ticketing.',
        'Led .NET-based R&D projects for rapid prototyping and system innovation.',
        'Migrated legacy systems to modern .NET hybrid architectures.',
        'Built PoCs for IoT (MQTT), debugging tools, and context-aware assistants.',
        'Created RDLC Application for internal workflow, end-to-end requirement to delivery.',
      ],
    },
    {
      label: 'Client delivery',
      items: [
        'Led ONDC (Open Network for Digital Commerce) integration.',
        'E-commerce: Jockey, Speedo, Manyavar, LuxCozi (Angular + .NET).',
        'RevalERP · RevalHRM · RevalCRM · RevalCMS · RevalPOS · RevalInventory · RevalProject · RevalSales.',
        'Reval Meet — video conferencing platform (WebRTC + SignalR + Node.js).',
      ],
    },
  ],
};

/** Every contribution as one list, for the résumé and plain-text views. */
export const responsibilities = experience.groups.flatMap((g) => g.items);

export const education = {
  degree: 'B.Sc in Computer Science',
  institution: 'Satavahana University',
  location: 'Karimnagar, Telangana',
  description: 'Graduated with a Bachelor of Science degree, focusing on core computer science principles, data structures, algorithms, and software development fundamentals.'
};

export type ProjectCard = {
  title: string;
  description: string;
  tech: string[];
  /** Slug of a blog post that writes this project up. */
  post?: string;
  /** Shown large at the top of the Projects page. */
  featured?: boolean;
  /** One measurable result, shown on featured cards. */
  outcome?: string;
};

export const keyProjects: ProjectCard[] = [
  {
    title: 'Multi-Tenant AI Chatbot Platform',
    description:
      'Embeddable RAG assistant on .NET 10: Semantic Kernel agents, pgvector retrieval, a text-to-SQL agent, MCP tools, episodic memory, per-workspace PII masking, SignalR streaming and RabbitMQ ingestion.',
    tech: ['.NET 10', 'Semantic Kernel', 'pgvector', 'RabbitMQ', 'Next.js 16'],
    post: 'rag-chatbot-latency-audit',
    featured: true,
    outcome: 'Latency audit traced 40 s answers to 7–8 LLM calls per request; the fix plan targets ~70% faster replies.',
  },
  {
    title: 'Offline-First Procurement & Inspection App',
    description:
      'Next.js PWA plus Android shell for field procurement: one storage interface over Android SQLite and IndexedDB, master-data sync, and a transactional outbox that replays actions when back online.',
    tech: ['Next.js', '.NET', 'SQLite', 'IndexedDB', 'Android'],
    featured: true,
  },
  {
    title: 'Uptime & Incident Management Platform',
    description:
      'Uptime Kuma as a headless check engine behind a custom .NET 10 API and React admin: incidents, maintenance windows, FCM push alerts, flapping suppression, self-healing hooks and ticketing.',
    tech: ['.NET 10', 'Uptime Kuma', 'React Router', 'PostgreSQL', 'Docker'],
    featured: true,
  },
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

export type ClientProject = {
  id: string;
  title: string;
  client: string;
  role: string;
  duration: string;
  url?: string;
  description: string;
  responsibilities: string[];
  tech: string[];
};

// E-commerce portals and integrations delivered for clients.
export const clientProjects: ClientProject[] = [
  {
    id: 'fossil-india',
    title: 'Fossil India',
    client: 'Fossil India',
    role: 'Lead Architect (Migration)',
    duration: '2023 – 2024',
    description:
      'Led migration from Angular to Next.js with focus on performance, security, and feature parity.',
    responsibilities: [
      'Defined migration strategy and phased rollout for minimal disruption.',
      'Implemented performance optimizations (lazy hydration, dynamic imports, image and font optimizations).',
      'Established nonce-based CSP and secure headers for production environments.',
      'Coordinated SEO, metadata mapping and QA verification for organic ranking preservation.',
    ],
    tech: ['Next.js', 'React', 'TypeScript', 'CSS Modules'],
  },
  {
    id: 'jockey',
    title: 'Jockey',
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
    id: 'manyavar',
    title: 'Manyavar',
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
    title: 'LuxCozi',
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
    id: 'speedo',
    title: 'Speedo',
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
];

export type Status = 'SHIPPED' | 'WIP' | 'POC' | 'RESEARCH';

export type Experiment = {
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
    title: 'On-Demand ISR: Next.js 16 + .NET',
    description: 'Static pages with zero API calls per view, kept fresh by signed webhooks from .NET that expire exact cache tags. Handles new and deleted pages without a rebuild.',
    tech: ['Next.js 16', 'ASP.NET Core', 'ISR', 'Webhooks'],
    status: 'POC',
    post: 'nextjs-dotnet-on-demand-isr',
  },
  {
    title: 'MCP Server for Code & Database Intelligence',
    description: 'Gives AI assistants a map of large C# codebases: Roslyn analyses whole solutions (classes, methods, dependencies, stored procedures used, complexity) and SQL Server catalogue views supply tables, keys and procedures. Scheduled per-workspace syncs store it in MongoDB, exposed as 40+ MCP tools with a Blazor dashboard and live logs.',
    tech: ['MCP', 'Roslyn', '.NET', 'MongoDB', 'SQL Server', 'Blazor'],
    status: 'WIP',
    post: 'mcp-server-code-database-intelligence',
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
