import { OG_SIZE, ogCard } from '@/lib/og-card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Boda Madhukar Reddy — engineering blog';

export default function Image() {
  return ogCard({
    eyebrow: 'Engineering blog',
    title: 'Notes from building fast, observable systems.',
    meta: '.NET · RAG · MCP · k6',
  });
}
