import { getContent } from '@/lib/content';
import { OG_SIZE, ogCard } from '@/lib/og-card';
import { experienceSince } from '@/lib/utils';

export const size = OG_SIZE;
export const contentType = 'image/jpeg';
export const alt = 'Boda Madhukar Reddy, Senior Software Engineer: .NET, self-hosted AI and performance engineering';

export default async function Image() {
  const { experience, keyProjects, clientProjects, posts } = await getContent();
  return ogCard({
    eyebrow: 'Portfolio & engineering blog',
    title: 'I build high-throughput .NET APIs and self-hosted AI platforms.',
    stats: [
      { value: `${experienceSince(experience.duration).years}+`, label: 'years building' },
      { value: String(keyProjects.length + clientProjects.length), label: 'projects delivered' },
      { value: String(posts.length), label: 'engineering posts' },
    ],
    stack: ['.NET', 'RAG', 'MCP', 'Agent Framework', 'k6'],
  });
}
