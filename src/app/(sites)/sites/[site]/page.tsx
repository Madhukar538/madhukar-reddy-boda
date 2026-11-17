import { notFound } from 'next/navigation';
import { EditorialHome } from '@/components/editorial/editorial-home';
import { getSiteContent } from '@/lib/site-content';
import { experienceSince } from '@/lib/utils';

export const revalidate = 60;

export default async function SiteHome({ params }: { params: Promise<{ site: string }> }) {
  const content = await getSiteContent((await params).site);
  if (!content) notFound();
  return (
    <EditorialHome
      variant="site"
      projects={content.keyProjects}
      metrics={[]}
      since={content.experience.duration ? experienceSince(content.experience.duration).since : ''}
      story={content.story}
    />
  );
}
