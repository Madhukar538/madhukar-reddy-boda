import { getContent } from '@/lib/content';
import { OG_SIZE, ogCard } from '@/lib/og-card';

export const size = OG_SIZE;
export const contentType = 'image/jpeg';
export const alt = 'Boda Madhukar Reddy, Software Architect: .NET, self-hosted AI and performance engineering';

export default async function Image() {
  const { experience, keyProjects, clientProjects, posts } = await getContent();
  const startYear = Number(experience.duration.match(/\d{4}/)?.[0] ?? 2021);
  return ogCard({
    eyebrow: 'Portfolio & engineering blog',
    title: 'I build high-throughput .NET APIs and self-hosted AI platforms.',
    stats: [
      { value: `${new Date().getFullYear() - startYear}+`, label: 'years building' },
      { value: String(keyProjects.length + clientProjects.length), label: 'projects delivered' },
      { value: String(posts.length), label: 'engineering posts' },
    ],
    stack: ['.NET', 'RAG', 'MCP', 'Agent Framework', 'k6'],
  });
}
