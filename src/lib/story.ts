import { z } from 'zod';

/**
 * The Editorial homepage as data: the hero, the running logo band, and the journey's chapters
 * with the exhibit beside each. Each site keeps its own (the API's GetStory, edited in the
 * admin's Story page); BUILT_IN_STORY is this site's own and stands in until one is saved, or if
 * a saved one doesn't validate. Text is plain: **bold** and *emphasis* are the only markup.
 */

/** Where a link may point: a page on the site, or an https address. */
const href = z.string().max(300).refine((v) => /^\/(?!\/)/.test(v) || /^https:\/\//.test(v), 'Links must start with / or https://');
const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();

const exhibit = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('ticket'), kicker: text(60), big: text(20), line: optionalText(80), mono: optionalText(80), stamp: optionalText(6) }),
  z.object({ kind: z.literal('list'), kicker: text(60), items: z.array(text(40)).min(1).max(8), tag: optionalText(60) }),
  z.object({
    kind: z.literal('bars'),
    kicker: text(60),
    rows: z.array(z.object({ label: text(30), value: text(30), tone: z.enum(['before', 'after', 'shrink']) })).min(1).max(4),
    note: optionalText(100),
  }),
  z.object({ kind: z.literal('tree'), kicker: text(60), items: z.array(text(60)).min(1).max(8), note: optionalText(100) }),
  z.object({ kind: z.literal('grid'), kicker: text(60), cells: z.number().int().min(1).max(64), big: optionalText(30), note: optionalText(100) }),
  z.object({
    kind: z.literal('team'),
    kicker: text(60),
    rows: z.array(z.array(z.object({ label: text(40), tone: z.enum(['you', 'lead', 'member']).default('member') })).min(1).max(4)).min(1).max(4),
    bar: z.object({ label: text(30), value: text(30) }).optional(),
  }),
]);

export const storySchema = z.object({
  hero: z.object({
    /** For screen readers: who and what, in one sentence. */
    heading: text(200),
    /** The small line above the name (the career start is added after these). */
    meta: z.array(text(60)).min(1).max(3),
    /** The big kinetic name, one entry per line (2–3 lines read best). */
    nameLines: z.array(text(14)).min(1).max(3),
    /** Short facts beside the name. */
    index: z.array(z.object({ label: text(20), value: text(60) })).max(5),
    /** The words around the turning badge. */
    badge: text(60),
    /** Show the live "how I ship" agent map in the middle of the hero. */
    showAgentMap: z.boolean().default(false),
    /** The large line under the name (**bold**, *emphasis*). */
    lede: text(200),
    /** The paragraph beside it. */
    body: text(600),
  }),
  /** The running band: labels with a logo (an icon slug from TICKER_ICONS, or "ai" for a sparkle). */
  ticker: z.array(z.object({ label: text(30), icon: z.string().max(40).default('ai') })).max(30),
  story: z.object({
    kicker: text(60),
    /** The section's headline (*emphasis* in orange). */
    headline: text(200),
    chapters: z
      .array(
        z.object({
          no: text(4),
          era: text(60),
          title: text(100),
          body: text(800),
          proof: optionalText(120),
          links: z.array(z.object({ href, label: text(60) })).max(3).optional(),
          exhibit: exhibit.default({ kind: 'none' }),
        })
      )
      .max(12),
  }),
  /** The Experience page told in acts: the experience groups in story order, each with an act title. Optional. */
  journey: z
    .object({
      kicker: text(60),
      acts: z.array(z.object({ group: text(80), title: text(80) })).max(10),
    })
    .optional(),
  /**
   * The About page as a Q&A. Optional. Answers may link with [label](/path); {name}, {degree},
   * {institution}, {location} and {since} are filled in from the profile.
   */
  about: z
    .object({
      kicker: text(60),
      title: text(120),
      byline: text(160),
      qa: z.array(z.object({ q: text(120), a: text(800) })).max(10),
    })
    .optional(),
});

export type Story = z.infer<typeof storySchema>;
export type StoryJourney = NonNullable<Story['journey']>;
export type StoryAbout = NonNullable<Story['about']>;
export type StoryExhibit = Story['story']['chapters'][number]['exhibit'];

/** Where an inline link in story text may point (the same rule as chapter links). */
export const isSafeHref = (value: string) => /^\/(?!\/)/.test(value) || /^https:\/\//.test(value);

/** Fills {name}-style placeholders from the given values; unknown ones stay as written. */
export const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** A stored story, or null when it is missing or doesn't validate (then the built-in one is used). */
export function parseStory(json: string | null | undefined): Story | null {
  if (!json) return null;
  try {
    const result = storySchema.safeParse(JSON.parse(json));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** This site's own story: what the Editorial homepage showed before it became data. */
export const BUILT_IN_STORY: Story = {
  hero: {
    heading: 'Boda Madhukar Reddy: I build fast .NET systems, and ship them with teams of AI agents.',
    meta: ['A story in chapters', 'Senior Software Engineer · AI Architect'],
    nameLines: ['Madhu—', 'kar', 'Reddy'],
    index: [
      { label: 'Role', value: 'Senior Software Engineer, Revalsys' },
      { label: 'Focus', value: 'AI architecture · .NET · RAG · MCP' },
      { label: 'Based', value: 'Hyderabad, India' },
      { label: 'Status', value: 'Open to fixing bugs' },
    ],
    badge: 'AI ARCHITECT ✶ .NET ENGINEER ✶ FIXES BUGS ✶',
    showAgentMap: true,
    lede: 'Builds fast **.NET** systems, and ships them with *teams of AI agents*.',
    body: 'Senior backend engineer at Revalsys, Hyderabad. I lead AI coding agents (Claude Code, Codex, Copilot, Antigravity) with specs, skills and review, and take what they build to production: multi-tenant RAG and MCP platforms, Solr 9 hybrid search, and APIs load-tested with k6.',
  },
  ticker: [
    { label: 'AI Architect', icon: 'ai' },
    { label: '.NET 8–10', icon: 'dotnet' },
    { label: 'MCP', icon: 'modelcontextprotocol' },
    { label: 'Claude Code', icon: 'claude' },
    { label: 'Agentic AI', icon: 'ai' },
    { label: 'Ollama', icon: 'ollama' },
    { label: 'Solr 9', icon: 'apachesolr' },
    { label: 'pgvector', icon: 'postgresql' },
    { label: 'k6', icon: 'k6' },
    { label: 'Grafana', icon: 'grafana' },
    { label: 'MongoDB', icon: 'mongodb' },
    { label: 'Redis', icon: 'redis' },
    { label: 'Next.js', icon: 'nextdotjs' },
    { label: 'React', icon: 'react' },
    { label: 'TypeScript', icon: 'typescript' },
    { label: 'Angular', icon: 'angular' },
    { label: 'GitHub Copilot', icon: 'githubcopilot' },
    { label: 'Docker', icon: 'docker' },
    { label: 'Cloudflare', icon: 'cloudflare' },
    { label: 'MQTT', icon: 'mqtt' },
    { label: 'WebRTC', icon: 'webrtc' },
  ],
  story: {
    kicker: 'The journey so far',
    headline: 'Nearly five years, *one thread:* make it work, make it fast, then teach machines to help.',
    chapters: [
      {
        no: '00',
        era: 'Prologue · Karimnagar',
        title: 'It started with a B.Sc',
        body: 'Computer science at Satavahana University, Karimnagar: data structures, algorithms and the first programs that actually ran. Enough to know I wanted to build things people use.',
        exhibit: { kind: 'ticket', kicker: 'Admit one · Prologue', big: 'B.Sc', line: 'Computer Science', mono: 'Satavahana University · Karimnagar', stamp: '00' },
      },
      {
        no: '01',
        era: 'Dec 2021 · Hyderabad',
        title: 'First job, real traffic',
        body: 'I joined Revalsys and went straight into production code: core features for high-traffic e-commerce brands such as Jockey, Speedo, Manyavar and Fossil India on Angular and .NET, and the integration with ONDC, the Open Network for Digital Commerce.',
        proof: '5 e-commerce brands · ONDC integration',
        links: [{ href: '/experience', label: 'The experience' }],
        exhibit: { kind: 'list', kicker: 'Shipped for', items: ['Jockey', 'Speedo', 'Manyavar', 'LuxCozi', 'Fossil India'], tag: '+ ONDC integration' },
      },
      {
        no: '02',
        era: 'Making it fast',
        title: 'Learning to measure before guessing',
        body: 'Slow pages taught me to measure first. I built repeatable k6 load tests with Grafana dashboards to set real SLA baselines, and traced slow queries to full collection scans, fixed with the right MongoDB indexes.',
        proof: '500–2,000 ms → 5–50 ms queries',
        links: [
          { href: '/blog/load-testing-microservices-k6-grafana', label: 'Load testing with k6' },
          { href: '/blog/dotnet-performance-tuning-api-throughput', label: '.NET performance tuning' },
        ],
        exhibit: {
          kind: 'bars',
          kicker: 'MongoDB query latency',
          rows: [
            { label: 'Before', value: '500–2,000 ms', tone: 'before' },
            { label: 'After', value: '5–50 ms', tone: 'after' },
          ],
          note: 'compound + unique indexes, measured with k6',
        },
      },
      {
        no: '03',
        era: 'Leading R&D',
        title: 'From prototypes to systems',
        body: 'I became the sole lead for the company’s .NET R&D: moving legacy systems to modern .NET, a WebRTC video platform, IoT proofs of concept over MQTT, offline-first apps and an incident-management platform. Most of them started as a question and ended as something running.',
        proof: 'Every .NET R&D project, one lead',
        links: [{ href: '/lab', label: 'The R&D lab' }],
        exhibit: {
          kind: 'tree',
          kicker: '~/rnd',
          items: ['legacy → .NET', 'webrtc-video/', 'iot-mqtt/', 'offline-first-pwa/', 'incident-platform/'],
          note: 'one lead, every .NET R&D project',
        },
      },
      {
        no: '04',
        era: 'AI arrives',
        title: 'Building what AI runs on',
        body: 'Then the work turned to AI: a multi-tenant RAG platform on .NET 10, an MCP server that gives assistants a map of C# code and SQL Server schemas, hybrid search on Solr 9, and models moved onto our own GPU server instead of a cloud bill.',
        proof: '40+ MCP tools · ~₹10,000 a month saved',
        links: [
          { href: '/blog/mcp-server-code-database-intelligence', label: 'The MCP server' },
          { href: '/lab/hybrid-search', label: 'Hybrid search, live' },
        ],
        exhibit: { kind: 'grid', kicker: 'MCP server · 40+ tools', cells: 40, big: '~₹10,000', note: 'a month saved, models on our own GPU server' },
      },
      {
        no: '05',
        era: 'Today',
        title: 'Leading a team of AI agents',
        body: 'Now I lead AI coding agents the way a tech lead leads people: Claude Code plans and delegates, Antigravity builds, Copilot and Codex review, and every change is proven before it ships. The same discipline took our RAG chatbot from 40 seconds an answer to about 13.',
        proof: '40 s → 13 s answers · 260 person-days → 2-day foundation',
        links: [
          { href: '/blog/herdr-ai-agent-team-claude-code-antigravity-copilot-codex', label: 'How the agent team works' },
          { href: '/blog/why-i-am-an-agentic-developer', label: 'The evidence' },
        ],
        exhibit: {
          kind: 'team',
          kicker: 'The team today',
          rows: [
            [{ label: 'You', tone: 'you' }],
            [{ label: 'Claude Code · lead', tone: 'lead' }],
            [
              { label: 'Antigravity · build', tone: 'member' },
              { label: 'Copilot · review', tone: 'member' },
              { label: 'Codex · review', tone: 'member' },
            ],
          ],
          bar: { label: 'Answer time', value: '40 s → 13 s' },
        },
      },
    ],
  },
  journey: {
    kicker: 'The road so far',
    acts: [
      { group: 'Client delivery', title: 'Shipping for real users' },
      { group: 'Performance & tooling', title: 'Making it fast' },
      { group: 'Architecture & R&D', title: 'Leading R&D' },
      { group: 'AI platforms', title: 'Building for AI' },
    ],
  },
  about: {
    kicker: 'About · In my own words',
    title: 'The engineer *behind the work*',
    byline: '{name} · Senior Software Engineer & AI Architect · Hyderabad',
    qa: [
      {
        q: 'What do you do?',
        a: 'I build backend systems and AI platforms, and I lead teams of AI coding agents to ship them. Day to day that is **.NET 10 APIs**, Next.js, Solr, Redis, SQL Server and MongoDB, carrying high traffic.',
      },
      {
        q: 'How do you work?',
        a: 'Production-first: **diagnose fast, fix right, prevent recurrence.** I measure before I guess, with k6 and Grafana, query and index tuning, and memory and GC work.',
      },
      {
        q: 'Where does AI fit?',
        a: 'In two places. What I build: RAG, Semantic Kernel, Microsoft Agent Framework, MCP servers, hybrid vector search and self-hosted LLMs on Ollama. And how I build: Claude Code, Codex, Copilot and Antigravity working as a team, with every change reviewed and proven.',
      },
      {
        q: 'Where did it start?',
        a: '{degree} at {institution}, {location}. Building professionally since {since}, in Hyderabad.',
      },
      {
        q: 'What are you open to?',
        a: 'Fixing bugs and giving solutions. If something is slow, broken or stuck, [send it over](/fix-a-bug).',
      },
    ],
  },
};
