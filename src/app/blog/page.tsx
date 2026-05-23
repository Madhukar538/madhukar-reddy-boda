import { BlogArchiveClient } from '@/components/portfolio/blog-archive-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — Boda Madhukar Reddy',
  description: 'Technical writing on .NET performance engineering, high-throughput APIs, load testing with k6, and AI/ML system design.',
};

export default function BlogArchive() {
  return <BlogArchiveClient />;
}
