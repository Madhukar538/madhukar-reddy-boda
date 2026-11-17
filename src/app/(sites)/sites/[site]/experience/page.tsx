import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditorialJourney } from '@/components/editorial/editorial-journey';
import { getSiteContent } from '@/lib/site-content';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Experience' };

export default async function SiteExperience({ params }: { params: Promise<{ site: string }> }) {
  const content = await getSiteContent((await params).site);
  if (!content) notFound();
  const { experience } = content;
  return (
    <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-10 lg:pt-24 pb-16">
      <h1 className="sr-only">Experience</h1>
      <EditorialJourney experience={experience} stats={[]} journey={content.story.journey} />
    </div>
  );
}
