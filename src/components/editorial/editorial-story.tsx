import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

/**
 * The Editorial homepage told as a journey: chapters from the degree to today's team of AI
 * agents. Every fact here is also on the Experience page, the projects or the posts it links to.
 * Each chapter's number stays pinned beside it while you read it; a line down the left fills as
 * you go (components/editorial/editorial-fx.tsx sets --story-p).
 */

type Chapter = {
  no: string;
  era: string;
  title: string;
  body: string;
  proof?: string;
  links?: { href: string; label: string }[];
};

const CHAPTERS: Chapter[] = [
  {
    no: '00',
    era: 'Prologue · Karimnagar',
    title: 'It started with a B.Sc',
    body: 'Computer science at Satavahana University, Karimnagar: data structures, algorithms and the first programs that actually ran. Enough to know I wanted to build things people use.',
  },
  {
    no: '01',
    era: 'Dec 2021 · Hyderabad',
    title: 'First job, real traffic',
    body: 'I joined Revalsys and went straight into production code: core features for high-traffic e-commerce brands such as Jockey, Speedo, Manyavar and Fossil India on Angular and .NET, and the integration with ONDC, the Open Network for Digital Commerce.',
    proof: '5 e-commerce brands · ONDC integration',
    links: [{ href: '/experience', label: 'The experience' }],
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
  },
  {
    no: '03',
    era: 'Leading R&D',
    title: 'From prototypes to systems',
    body: 'I became the sole lead for the company’s .NET R&D: moving legacy systems to modern .NET, a WebRTC video platform, IoT proofs of concept over MQTT, offline-first apps and an incident-management platform. Most of them started as a question and ended as something running.',
    proof: 'Every .NET R&D project, one lead',
    links: [{ href: '/lab', label: 'The R&D lab' }],
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
  },
];

export function EditorialStory() {
  return (
    <section className="ed-story" aria-labelledby="ed-story-title">
      <header className="ed-story-head">
        <p className="ed-story-kicker">( The journey so far )</p>
        <h2 id="ed-story-title">
          Nearly five years, <em>one thread:</em> make it work, make it fast, then teach machines to help.
        </h2>
      </header>
      <ol className="ed-chapters">
        {CHAPTERS.map((c) => (
          <li key={c.no} className="ed-chapter">
            <div className="ed-chapter-mark" aria-hidden>
              <span className="ed-chapter-no">{c.no}</span>
            </div>
            <div className="ed-chapter-text ed-reveal">
              <p className="ed-chapter-era">
                <span className="sr-only">Chapter {c.no}: </span>
                {c.era}
              </p>
              <h3>{c.title}</h3>
              <p className="ed-chapter-body">{c.body}</p>
              {c.proof && <p className="ed-chapter-proof">{c.proof}</p>}
              {c.links && (
                <p className="ed-chapter-links">
                  {c.links.map((l) => (
                    <Link key={l.href} href={l.href} className="ed-link">
                      {l.label} <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ))}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
