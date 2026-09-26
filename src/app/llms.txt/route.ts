import { getContent } from '@/lib/content';

// llms.txt (https://llmstxt.org): a plain-text map of the site for AI tools.
// Built from the same content as the pages.
// Rendered per request from the tagged data cache (lib/content.ts), so it is
// current as soon as content changes; static route handlers aren't revalidated by tag.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { posts, experience, keyProjects, profile, rdProjects, skillCategories } = await getContent();
  const lines = [
    `# ${profile.name}`,
    '',
    `> ${profile.title} at ${profile.company}, ${profile.location}. ${profile.summary}`,
    '',
    'Availability: working at Revalsys Technologies; open to fixing bugs and giving solutions.',
    `Contact: ${profile.email} · ${profile.github}`,
    '',
    '## MCP server',
    '',
    '- [MCP endpoint](/mcp): Streamable HTTP, read-only. Tools: get_profile, get_experience, get_skills, list_projects, search_blog, list_blog_posts, get_blog_post. Prompt: assess_fit.',
    '- [How to connect](/ai)',
    '',
    '## Pages',
    '',
    '- [Blog](/): home page, every post with search',
    '- [Topics](/topics): posts grouped by area and tool',
    '- [RSS feed](/rss.xml)',
    '- [Fix a bug](/fix-a-bug): send a bug or architecture question as a ticket',
    '- [About](/about): summary, tech stack, education',
    `- [Experience](/experience): ${experience.title}, ${experience.company} (${experience.duration})`,
    '- [Projects](/projects): key projects and e-commerce builds',
    '- [R&D Lab](/lab): experiments, prototypes and research',
    '- [Résumé (PDF)](/resume.pdf)',
    '',
    '## Blog',
    '',
    ...posts.map((p) => `- [${p.title}](/blog/${p.slug}): ${p.excerpt}`),
    '',
    '## Key projects',
    '',
    ...keyProjects.map((p) => `- ${p.title}: ${p.description} (${p.tech.join(', ')})`),
    '',
    '## R&D Lab',
    '',
    ...rdProjects.map((p) => `- ${p.title} [${p.status}]: ${p.description}`),
    '',
    '## Skills',
    '',
    ...skillCategories.map((c) => `- ${c.title}: ${c.skills.join(', ')}`),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
