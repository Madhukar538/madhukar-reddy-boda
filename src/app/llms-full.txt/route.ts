import { getContent } from '@/lib/content';
import { postToText } from '@/lib/portfolio-text';
import { siteUrl } from '@/lib/blog';

// llms-full.txt (https://llmstxt.org): The complete text of all blog posts,
// architectural blueprints, and engineering projects in a single Markdown file.
// Used by AI search engines (Perplexity, ChatGPT, Claude) to ingest full context.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { posts, experience, keyProjects, profile, rdProjects, skillCategories } = await getContent();
  const base = siteUrl();

  const lines: string[] = [
    `# ${profile.name} — Engineering Library & Architectural Knowledge Base`,
    '',
    `> ${profile.title} at ${profile.company}, ${profile.location}.`,
    `> ${profile.summary}`,
    '',
    `- Email: ${profile.email}`,
    `- GitHub: ${profile.github}`,
    `- LinkedIn: ${profile.linkedin}`,
    `- Website: ${base}`,
    `- Canonical Base URL: ${base}`,
    `- Full AI Index: ${base}/llms-full.txt`,
    `- Summary Index: ${base}/llms.txt`,
    `- MCP Server Endpoint: ${base}/mcp`,
    '',
    '---',
    '',
    '## Table of Contents',
    '',
    '1. [Core Profile & Engineering Skills](#core-profile--engineering-skills)',
    '2. [Architectural Experience & Leadership](#architectural-experience--leadership)',
    '3. [Flagship Systems & Projects](#flagship-systems--projects)',
    '4. [R&D Laboratory & Prototypes](#rd-laboratory--prototypes)',
    '5. [Full Engineering Articles & Deep-Dives](#full-engineering-articles--deep-dives)',
    '',
    '---',
    '',
    '## Core Profile & Engineering Skills',
    '',
    `**Current Focus:** ${profile.now}`,
    '',
    '### Technical Skills by Category',
    '',
    ...skillCategories.flatMap((cat) => [
      `#### ${cat.title}`,
      cat.skills.map((s) => `- ${s}`).join('\n'),
      '',
    ]),
    '---',
    '',
    '## Architectural Experience & Leadership',
    '',
    `### ${experience.title} — ${experience.company} (${experience.duration})`,
    `*Location: ${experience.location} | Type: ${experience.type}*`,
    '',
    '**Key Highlights:**',
    ...experience.highlights.map((h) => `- **${h.label}:** ${h.value}`),
    '',
    '**Detailed Workstreams:**',
    ...experience.groups.flatMap((g) => [
      `#### ${g.label}`,
      ...g.items.map((item) => `- ${item}`),
      '',
    ]),
    '---',
    '',
    '## Flagship Systems & Projects',
    '',
    ...keyProjects.flatMap((p) => [
      `### ${p.title}`,
      p.description,
      '',
      `**Technologies:** ${p.tech.join(', ')}`,
      p.post ? `*Related Write-up: /blog/${p.post}*` : '',
      '',
    ]),
    '---',
    '',
    '## R&D Laboratory & Prototypes',
    '',
    ...rdProjects.flatMap((p) => [
      `### ${p.title} [Status: ${p.status}]`,
      p.description,
      '',
      `**Technologies:** ${p.tech.join(', ')}`,
      p.post ? `*Write-up: /blog/${p.post}*` : '',
      '',
    ]),
    '---',
    '',
    '## Full Engineering Articles & Deep-Dives',
    '',
    'The following section contains the complete, unabridged text of all published engineering articles:',
    '',
    ...posts.flatMap((p, idx) => [
      `### Article ${idx + 1}: ${p.title}`,
      `*Published: ${p.date} | Category: ${p.category} | Reading Time: ${p.readTime}*`,
      `*Canonical URL: ${base}/blog/${p.slug}*`,
      `*Tags: ${p.tags.join(', ')}*`,
      '',
      p.excerpt,
      '',
      postToText(p),
      '',
      '---',
      '',
    ]),
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
