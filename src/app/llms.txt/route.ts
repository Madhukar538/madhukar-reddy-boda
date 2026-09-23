import { blogs } from '@/data/blogs';
import { experience, keyProjects, profile, rdProjects, skillCategories } from '@/data/profile';

// llms.txt (https://llmstxt.org): a plain-text map of the site for AI tools.
// Built at deploy time from the same data as the pages.
export const dynamic = 'force-static';

export function GET() {
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
    ...blogs.map((p) => `- [${p.title}](/blog/${p.slug}): ${p.excerpt}`),
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
