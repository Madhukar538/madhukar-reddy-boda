import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
// The MCP SDK validates with zod 4; the rest of the app still uses zod 3.
import { z } from 'zod4';
import type { Profile, SiteContent } from '@/lib/content';
import { postToText, searchBlog } from '@/lib/portfolio-text';

/**
 * Read-only MCP server exposing the portfolio to AI assistants.
 * Everything comes from the same data the website renders.
 */

const json = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
});

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] });

const readOnly = { readOnlyHint: true, openWorldHint: false } as const;

function contact(profile: Profile) {
  return {
    name: profile.name,
    title: profile.title,
    company: profile.company,
    location: profile.location,
    email: profile.email,
    phone: profile.phone,
    github: profile.github,
    availability: 'Working at Revalsys Technologies; open to fixing bugs and giving solutions.',
  };
}

export function createPortfolioServer(siteUrl: string, content: SiteContent) {
  const { posts: blogs, profile, experience, education, skillCategories, keyProjects, rdProjects } = content;
  const server = new McpServer(
    { name: 'boda-madhukar-reddy-portfolio', version: '1.0.0' },
    {
      instructions:
        `Portfolio of ${profile.name}, ${profile.title} at ${profile.company} (${profile.location}). ` +
        'Use get_profile for a summary, get_experience / get_skills / list_projects for detail, ' +
        'and search_blog + get_blog_post for his technical writing. All data is public and read-only.',
    }
  );

  server.registerTool(
    'get_profile',
    {
      title: 'Profile',
      description: `Summary, contact details and availability for ${profile.name}.`,
      annotations: readOnly,
    },
    async () =>
      json({
        ...contact(profile),
        summary: profile.summary,
        education: `${education.degree}, ${education.institution}`,
        resume_pdf: `${siteUrl}/resume.pdf`,
        website: siteUrl,
      })
  );

  server.registerTool(
    'get_experience',
    {
      title: 'Work experience',
      description: 'Current role, highlights and key contributions.',
      annotations: readOnly,
    },
    async () => json(experience)
  );

  server.registerTool(
    'get_skills',
    {
      title: 'Tech stack',
      description: 'Skills grouped by category. Optionally filter by category name or look up a single technology.',
      inputSchema: {
        category: z.string().optional().describe('Category name, e.g. "AI & LLMs" or "Backend" (case-insensitive, partial match).'),
        technology: z.string().optional().describe('Check whether a specific technology is listed, e.g. "Redis".'),
      },
      annotations: readOnly,
    },
    async ({ category, technology }) => {
      let groups = skillCategories.map(({ title, skills }) => ({ category: title, skills }));
      if (category) {
        const q = category.toLowerCase();
        groups = groups.filter((g) => g.category.toLowerCase().includes(q));
      }
      if (technology) {
        const q = technology.toLowerCase();
        const matches = groups.flatMap((g) =>
          g.skills.filter((s) => s.toLowerCase().includes(q)).map((skill) => ({ category: g.category, skill }))
        );
        return json({ technology, listed: matches.length > 0, matches });
      }
      return json(groups);
    }
  );

  server.registerTool(
    'list_projects',
    {
      title: 'Projects',
      description:
        'Key projects and R&D Lab experiments. Filter by kind, Lab status, or a keyword matched against title, description and tech.',
      inputSchema: {
        kind: z.enum(['all', 'key', 'lab']).default('all').describe('"key" = production projects, "lab" = R&D experiments.'),
        status: z
          .enum(['SHIPPED', 'WIP', 'POC', 'RESEARCH'])
          .optional()
          .describe('Lab status filter (only applies to Lab experiments).'),
        keyword: z.string().optional().describe('e.g. "RAG", "Solr", "MongoDB".'),
      },
      annotations: readOnly,
    },
    async ({ kind, status, keyword }) => {
      const key = keyProjects.map((p) => ({ kind: 'key' as const, ...p }));
      const lab = rdProjects
        .filter((p) => !status || p.status === status)
        .map((p) => ({ kind: 'lab' as const, ...p }));
      let items = kind === 'key' ? key : kind === 'lab' ? lab : [...(status ? [] : key), ...lab];
      if (keyword) {
        const q = keyword.toLowerCase();
        items = items.filter((p) => `${p.title} ${p.description} ${p.tech.join(' ')}`.toLowerCase().includes(q));
      }
      return json(
        items.map((p) => ({
          ...p,
          ...(p.post ? { writeup_url: `${siteUrl}/blog/${p.post}` } : {}),
        }))
      );
    }
  );

  server.registerTool(
    'search_blog',
    {
      title: 'Search blog',
      description: 'Keyword search over technical blog posts. Returns ranked matches with slugs for get_blog_post.',
      inputSchema: {
        query: z.string().min(1).describe('e.g. "vector search", "load testing", "Next.js caching".'),
        limit: z.number().int().min(1).max(10).default(5),
      },
      annotations: readOnly,
    },
    async ({ query, limit }) => {
      const results = searchBlog(blogs, query, limit).map((r) => ({ ...r, url: `${siteUrl}${r.url}` }));
      return json({ query, count: results.length, results });
    }
  );

  server.registerTool(
    'list_blog_posts',
    {
      title: 'List blog posts',
      description: 'All blog posts, newest first.',
      annotations: readOnly,
    },
    async () =>
      json(
        blogs.map((p) => ({
          slug: p.slug,
          title: p.title,
          date: p.date,
          category: p.category,
          tags: p.tags,
          excerpt: p.excerpt,
          url: `${siteUrl}/blog/${p.slug}`,
        }))
      )
  );

  server.registerTool(
    'get_blog_post',
    {
      title: 'Read blog post',
      description: 'Full text of a blog post (Markdown) by slug.',
      inputSchema: { slug: z.string().describe('Slug from search_blog or list_blog_posts.') },
      annotations: readOnly,
    },
    async ({ slug }) => {
      const post = blogs.find((p) => p.slug === slug);
      if (!post) {
        return {
          ...text(`No post with slug "${slug}". Available: ${blogs.map((p) => p.slug).join(', ')}`),
          isError: true,
        };
      }
      return text(`${postToText(post)}\n\nSource: ${siteUrl}/blog/${post.slug}`);
    }
  );

  // Resources: the same data, addressable by URI.
  server.registerResource(
    'profile',
    'portfolio://profile',
    { title: 'Profile', description: 'Profile, experience, skills and education.', mimeType: 'application/json' },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ ...contact(profile), summary: profile.summary, experience, skills: skillCategories, education }, null, 2),
        },
      ],
    })
  );

  server.registerResource(
    'blog-post',
    new ResourceTemplate('portfolio://blog/{slug}', {
      list: async () => ({
        resources: blogs.map((p) => ({
          uri: `portfolio://blog/${p.slug}`,
          name: p.title,
          description: p.excerpt,
          mimeType: 'text/markdown',
        })),
      }),
    }),
    { title: 'Blog post', description: 'A blog post as Markdown.', mimeType: 'text/markdown' },
    async (uri, { slug }) => {
      const post = blogs.find((p) => p.slug === String(slug));
      if (!post) throw new Error(`Unknown blog post: ${slug}`);
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: postToText(post) }] };
    }
  );

  // Prompt: evaluate fit for a role using the tools above.
  server.registerPrompt(
    'assess_fit',
    {
      title: 'Assess fit for a role',
      description: `Evaluate how well ${profile.name} matches a job description.`,
      argsSchema: { job_description: z.string().describe('Paste the job description.') },
    },
    ({ job_description }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Assess how well ${profile.name} fits this role. Use get_profile, get_experience, get_skills, ` +
              'list_projects and search_blog to gather evidence. Cite specific projects or posts for each ' +
              'requirement, call out gaps honestly, and end with a short summary.\n\n' +
              `Job description:\n${job_description}`,
          },
        },
      ],
    })
  );

  return server;
}
