import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditorialAbout } from '@/components/editorial/editorial-about';
import { getSiteContent } from '@/lib/site-content';

export const revalidate = 60;
export const metadata: Metadata = { title: 'About' };

export default async function SiteAbout({ params }: { params: Promise<{ site: string }> }) {
  const content = await getSiteContent((await params).site);
  if (!content) notFound();
  return (
    <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-10 lg:pt-24 pb-16">
      <EditorialAbout name={content.profile.name} education={content.education} about={content.story.about} />
    </div>
  );
}
