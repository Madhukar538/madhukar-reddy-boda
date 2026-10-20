import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Bug, Check, Gauge, Layers, Mail, MapPin, Sparkles, type LucideIcon } from 'lucide-react';
import { PageShell } from '@/components/portfolio/page-shell';
import { getContent } from '@/lib/content';
import { siteUrl } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Work with me — Boda Madhukar Reddy',
  description:
    'Performance audits and load testing for .NET APIs, self-hosted AI assistants and agents, architecture reviews, and fixing stubborn bugs.',
  alternates: { canonical: '/work-with-me' },
};

type Service = {
  icon: LucideIcon;
  title: string;
  /** The situation this is for. */
  fit: string;
  outcomes: string[];
  proof: { label: string; href: string };
  /** Pre-fills the enquiry form's title. */
  topic: string;
};

const services: Service[] = [
  {
    icon: Gauge,
    title: 'Performance audit & load testing',
    fit: 'Your .NET API is slow, or falls over when traffic grows.',
    outcomes: [
      'Repeatable k6 load tests with Grafana dashboards',
      'Profiling of the slow paths, end to end',
      'A ranked list of fixes with the time each one saves',
      'A re-test after the fixes, against your targets',
    ],
    proof: { label: 'How I run load tests', href: '/blog/load-testing-microservices-k6-grafana' },
    topic: 'Performance audit',
  },
  {
    icon: Sparkles,
    title: 'Self-hosted AI assistants & agents',
    fit: 'You want an assistant over your own documents and data, running on your own servers.',
    outcomes: [
      'Retrieval (RAG) over your documents and database',
      'Agents on Microsoft Agent Framework with MCP tools',
      'Local models with Ollama, so data stays in-house',
      'Tuning for answer speed, not just correctness',
    ],
    proof: { label: 'Answers from 30–40 s down to ~13 s', href: '/projects/multi-tenant-ai-chatbot' },
    topic: 'Self-hosted AI assistant',
  },
  {
    icon: Layers,
    title: 'Architecture review',
    fit: 'You are planning a rewrite, a new platform or a multi-tenant product.',
    outcomes: [
      'A review of the current design and its bottlenecks',
      'A target architecture: caching, messaging, observability',
      'A step-by-step plan that keeps production running',
    ],
    proof: { label: 'Systems I have built', href: '/projects' },
    topic: 'Architecture review',
  },
  {
    icon: Bug,
    title: 'Fix a stubborn bug',
    fit: 'One problem that has cost your team days: a crash, a leak, a race.',
    outcomes: [
      'Describe it once; it becomes a triaged ticket on my phone',
      'A quick answer, a call, or a proper fix',
    ],
    proof: { label: 'How bug tickets work', href: '/fix-a-bug' },
    topic: 'A stubborn bug',
  },
];

const steps = [
  { title: 'Tell me the problem', body: 'A few lines on what is wrong or what you want to build. Rough notes are fine.' },
  { title: 'A short call', body: 'We agree on the goal, the constraints and what "done" looks like.' },
  { title: 'A written plan', body: 'What I will do, in order, and what each step should change.' },
  { title: 'Build and hand over', body: 'The work, measured against the plan, with notes your team can keep using.' },
];

const enquire = (topic: string) => `/fix-a-bug?topic=${encodeURIComponent(topic)}`;

/** Services for teams: what Madhukar takes on alongside his full-time role, and how to start. */
export default async function WorkWithMePage() {
  const { profile, keyProjects, clientProjects, posts } = await getContent();
  const years = new Date().getFullYear() - 2021;
  const proof = [
    { value: '~13 s', label: 'AI answers, down from 30–40 s' },
    { value: `${years}+`, label: 'years building production systems' },
    { value: String(keyProjects.length + clientProjects.length), label: 'projects delivered' },
    { value: String(posts.length), label: 'engineering write-ups' },
  ];

  const base = siteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: base },
          { '@type': 'ListItem', position: 2, name: 'Work with me', item: `${base}/work-with-me` },
        ],
      },
      ...services.map((s, idx) => ({
        '@type': 'Service',
        '@id': `${base}/work-with-me#service-${idx + 1}`,
        name: s.title,
        description: s.fit,
        provider: { '@id': `${base}/#person` },
        areaServed: 'Worldwide',
        serviceType: s.topic,
      })),
    ],
  };

  return (
    <PageShell
      eyebrow="Work with me"
      title="Slow, stuck, or starting something new?"
      description="I work full-time as a Software Engineer at Revalsys, and on the side I help a few teams at a time with slow APIs, self-hosted AI and architecture decisions."
      actions={
        <>
          <Link href={enquire('a project')} className="tinted-button !px-5 !py-2.5">
            Tell me about it
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href={`mailto:${profile.email}?subject=${encodeURIComponent('Working together')}`} className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
            <Mail className="h-4 w-4" />
            Email me
          </a>
        </>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <section aria-labelledby="services-heading">
        <h2 id="services-heading" className="sr-only">What I can help with</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {services.map(({ icon: Icon, title, fit, outcomes, proof: link, topic }) => (
            <article key={title} className="glass flex flex-col p-6 md:p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-xl font-bold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{fit}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {outcomes.map((o) => (
                  <li key={o} className="flex gap-2.5 text-[15px] leading-snug">
                    <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--sys-green))]" />
                    {o}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-4">
                <Link href={link.href} className="tap inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                  <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
                <Link href={enquire(topic)} className="tap inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Ask about this <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-heading" className="mt-16 md:mt-24">
        <p className="eyebrow">How it works</p>
        <h2 id="how-heading" className="mb-6 text-2xl md:text-3xl font-bold tracking-tight">From first message to handover</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="glass p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{i + 1}</span>
              <p className="mt-3 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="proof-heading" className="mt-16 md:mt-24">
        <p className="eyebrow">Track record</p>
        <h2 id="proof-heading" className="mb-6 text-2xl md:text-3xl font-bold tracking-tight">Measured, not promised</h2>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {proof.map((p) => (
            <div key={p.label} className="glass p-5">
              <dt className="sr-only">{p.label}</dt>
              <dd className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{p.value}</dd>
              <dd className="mt-1 text-sm text-muted-foreground">{p.label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm text-muted-foreground">
          E-commerce platforms and integrations for Jockey, Speedo, Fossil India, Manyavar and LuxCozi.
        </p>
      </section>

      <section aria-labelledby="start-heading" className="mt-16 md:mt-24">
        <div className="glass flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="space-y-2">
            <h2 id="start-heading" className="text-2xl md:text-3xl font-bold tracking-tight">Have something in mind?</h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin aria-hidden className="h-4 w-4" /> Remote, from Hyderabad (IST, UTC+5:30)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={enquire('a project')} className="tinted-button !px-5 !py-2.5">
              Tell me about it
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={profile.linkedin || `mailto:${profile.email}`}
              {...(profile.linkedin ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="glass glass-pill glass-interactive inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
              {profile.linkedin ? 'Message on LinkedIn' : 'Email me'}
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
