/**
 * Scroll-driven case studies (/projects/[slug]). Each one tells a featured
 * project's story as chapters: problem → architecture → findings → plan.
 * Facts come from the project's published write-up; nothing here is new.
 */

export type CaseStat = { value: string; label: string };

type ChapterBase = {
  /** Anchor id, also shown in the progress rail. */
  id: string;
  /** Short label, e.g. "The problem". */
  label: string;
  title: string;
  body?: string[];
};

export type CaseChapter =
  | (ChapterBase & { kind: 'text'; points?: string[] })
  | (ChapterBase & { kind: 'diagram'; diagram: string })
  | (ChapterBase & { kind: 'bars'; unit: string; bars: { label: string; value: number; highlight?: boolean }[] })
  | (ChapterBase & { kind: 'cards'; cards: { title: string; body: string; fix: string }[] })
  | (ChapterBase & { kind: 'timeline'; steps: { when: string; what: string; target?: string }[] });

export type CaseStudy = {
  slug: string;
  /** Title of the key project (data/profile.ts) this case study belongs to. */
  project: string;
  title: string;
  summary: string;
  /** Status note shown under the stats, e.g. that results are targets. */
  note?: string;
  stats: CaseStat[];
  tech: string[];
  /** The full blog write-up. */
  post?: string;
  chapters: CaseChapter[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: 'multi-tenant-ai-chatbot',
    project: 'Multi-Tenant AI Chatbot Platform',
    title: 'From 40 seconds to about 13: rebuilding a multi-tenant AI agent',
    summary:
      'An embeddable RAG assistant on .NET 10 worked, but a data question took 30–40 seconds. An end-to-end audit ranked the fixes, the agent moved to Microsoft Agent Framework with MCP tools for data and docs, and most answers now arrive in about 13 seconds.',
    note: 'Measured on the running platform. The next step, a change to how the model runs on the server, is still being tested.',
    stats: [
      { value: '30–40 s', label: 'per data question, before' },
      { value: '~13 s', label: 'most answers now' },
      { value: '~2×', label: 'faster again, next (in testing)' },
    ],
    tech: ['.NET 10', 'Microsoft Agent Framework', 'MCP', 'pgvector', 'RabbitMQ', 'SignalR', 'Redis', 'MongoDB', 'Next.js 16'],
    post: 'rag-chatbot-latency-audit',
    chapters: [
      {
        kind: 'text',
        id: 'problem',
        label: 'The problem',
        title: 'It worked. It was just slow.',
        body: [
          'The platform is a multi-tenant RAG chatbot: an embeddable widget, SignalR streaming, pgvector retrieval, a text-to-SQL agent, MCP tools and episodic memory.',
          'Answers were right, but a data question took 30–40 seconds. Instead of guessing, I audited the whole request path to find out where the time went.',
        ],
      },
      {
        kind: 'diagram',
        id: 'architecture',
        label: 'Architecture',
        title: 'The platform in one picture',
        body: [
          'An ASP.NET Core gateway runs Semantic Kernel agents over pgvector, Redis, MongoDB and long-term memory. Heavy work (document ingestion and audit logging) goes through RabbitMQ consumers, so the gateway stays non-blocking. Vectors are namespaced per tenant.',
        ],
        diagram: 'rag-chatbot-latency-audit',
      },
      {
        kind: 'bars',
        id: 'time',
        label: 'Where the time went',
        title: 'About 13 seconds of every answer was waste',
        body: [
          'For a SQL-style question, roughly 12–15 seconds is unavoidable LLM and database work. The rest broke down like this:',
        ],
        unit: 'ms',
        bars: [
          { label: 'Nested SQL LLM calls', value: 8000, highlight: true },
          { label: 'Redundant intent re-parsing', value: 2000 },
          { label: 'Artificial streaming delay', value: 1500 },
          { label: 'Other overhead', value: 500 },
          { label: 'Duplicate vector search', value: 300 },
          { label: 'Redundant kernel clones', value: 300 },
        ],
      },
      {
        kind: 'cards',
        id: 'findings',
        label: 'Findings',
        title: 'Three patterns behind the delay',
        cards: [
          {
            title: 'An LLM call cascade',
            body: 'The SQL path classified intent, re-derived it, discovered tables, analysed the schema, generated SQL and validated it: 7–8 sequential LLM calls where 2–3 would do.',
            fix: 'One generation prompt with the relevant schema inlined, behind a feature flag and A/B tested on 20+ reference questions. Worth an estimated 8–12 s.',
          },
          {
            title: 'Streaming that wasn’t',
            body: 'Responses were re-chunked into 20-character pieces with a 15 ms pause each: 1.5 s of pure delay on a 2,000-character answer, on top of a model that already streams.',
            fix: 'Forward tokens as they arrive.',
          },
          {
            title: 'The same work, twice',
            body: 'Two services ran the same vector search; the kernel was cloned 3–4 times per request (50–100 ms each); MCP connections were opened per request (300–800 ms).',
            fix: 'Search once and pass it down, reuse the base kernel, and pool MCP connections with deterministic disposal.',
          },
        ],
      },
      {
        kind: 'timeline',
        id: 'plan',
        label: 'The plan',
        title: 'Ranked fixes, shipped in three steps',
        steps: [
          { when: 'Week 1', what: 'Quick wins: real streaming, one vector search, kernel reuse, MCP pooling.', target: '30–40 s → 20–25 s' },
          { when: 'Weeks 2–3', what: 'Single-shot SQL generation, cached intent, parallel pipeline steps.', target: '→ 8–12 s' },
          { when: 'Weeks 3–4', what: 'Tenant isolation in every cache key, retries for ingestion, per-tenant cache invalidation, latency dashboards.' },
        ],
      },
      {
        kind: 'cards',
        id: 'shipped',
        label: 'What shipped',
        title: 'Faster, and ready to run at customer sites',
        cards: [
          {
            title: 'A new agent core',
            body: 'The agent moved to Microsoft Agent Framework, with MCP tools that give it controlled access to the database and the documentation it needs to answer each question.',
            fix: 'Most answers now arrive in about 13 seconds, down from 30–40.',
          },
          {
            title: 'Answers you can explore',
            body: 'Interactive maps: pick a state to see its districts, then a district to see its cities, all without asking a new question.',
            fix: 'Follow-up questions became clicks, so users wait less and the model does less work.',
          },
          {
            title: 'Sign-in and licensing',
            body: 'Users sign in with a fingerprint, face or device PIN instead of a password. Each installation is licensed to one server for a fixed period, and the licence resists tampering and copying.',
            fix: 'A copied or moved installation stops working, and an expired licence pauses the application until renewal.',
          },
          {
            title: 'Remote installs and operations',
            body: 'Installs and upgrades run remotely. From one place the team backs up and restores data, rolls back an upgrade, upgrades several instances safely, and watches each service’s health and load.',
            fix: 'Supporting many servers no longer needs anyone on site.',
          },
        ],
      },
      {
        kind: 'text',
        id: 'hardware',
        label: 'Hardware',
        title: 'Choosing the GPU: bandwidth beat memory size',
        body: [
          'The same agent request on Gemma 4 26B took about 15 seconds on an RTX 5090 workstation and about 41 seconds on an NVIDIA DGX Spark. The model fits in the 5090’s 32 GB, and its roughly 6.6× higher memory bandwidth is what decides generation speed.',
        ],
        points: [
          'Next: a change to how the model runs on the server could make answers roughly twice as fast at the same quality. It is tested on our own server before it reaches customer servers.',
          'Full numbers and method in the post “RTX 5090 vs DGX Spark for a Local AI Agent”.',
        ],
      },
      {
        kind: 'text',
        id: 'lessons',
        label: 'Lessons',
        title: 'What I check first now',
        points: [
          'In LLM apps, count the calls before tuning anything else. Sequential calls dominate latency.',
          'Don’t simulate streaming on top of a model that already streams.',
          'Every cache key includes the tenant ID; anything else is a cross-tenant leak waiting to happen.',
          'Measure first: an audit turns a feeling into a ranked list of fixes with estimated savings.',
        ],
      },
    ],
  },
];

export const caseStudyFor = (projectTitle: string) => caseStudies.find((c) => c.project === projectTitle);
