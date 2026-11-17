import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { experienceSince } from '@/lib/utils';

/**
 * The About page in the Editorial look: a magazine-style Q&A in his own words, answered from the
 * same facts as the classic Overview (components/portfolio/summary.tsx) and the education data.
 * Shown only in Editorial (globals.css .ed-only); the classic hero and Overview are hidden there.
 */

type Props = { name: string; education: { degree: string; institution: string; location: string } };

export function EditorialAbout({ name, education }: Props) {
  const since = experienceSince();
  const qa: { q: string; a: React.ReactNode }[] = [
    {
      q: 'What do you do?',
      a: (
        <>
          I build backend systems and AI platforms, and I lead teams of AI coding agents to ship them. Day to day that is <strong>.NET 10 APIs</strong>, Next.js, Solr, Redis, SQL Server and MongoDB, carrying high traffic.
        </>
      ),
    },
    {
      q: 'How do you work?',
      a: (
        <>
          Production-first: <strong>diagnose fast, fix right, prevent recurrence.</strong> I measure before I guess, with k6 and Grafana, query and index tuning, and memory and GC work.
        </>
      ),
    },
    {
      q: 'Where does AI fit?',
      a: (
        <>
          In two places. What I build: RAG, Semantic Kernel, Microsoft Agent Framework, MCP servers, hybrid vector search and self-hosted LLMs on Ollama. And how I build: Claude Code, Codex, Copilot and Antigravity working as a team, with every change reviewed and proven.
        </>
      ),
    },
    {
      q: 'Where did it start?',
      a: (
        <>
          {education.degree} at {education.institution}, {education.location}. Building professionally since {since.since}, in Hyderabad.
        </>
      ),
    },
    {
      q: 'What are you open to?',
      a: (
        <>
          Fixing bugs and giving solutions. If something is slow, broken or stuck,{' '}
          <Link href="/fix-a-bug" className="ed-link">
            send it over <ArrowUpRight className="h-4 w-4" />
          </Link>
          .
        </>
      ),
    },
  ];

  return (
    <div className="ed-only ed-about">
      <header className="ed-about-head">
        <p className="ed-story-kicker">( About · In my own words )</p>
        {/* The page's heading in this look; a role, as the classic hero's <h1> is in the same page. */}
        <p role="heading" aria-level={1} className="ed-about-title">
          The engineer <em>behind the work</em>
        </p>
        <p className="ed-about-byline">
          {name} · Senior Software Engineer &amp; AI Architect · Hyderabad
        </p>
      </header>
      <dl className="ed-qa">
        {qa.map(({ q, a }, i) => (
          <div key={q} className="ed-reveal">
            <dt>
              <span aria-hidden>Q{i + 1}</span>
              {q}
            </dt>
            <dd>{a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
