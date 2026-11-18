import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminSessionProvider } from '@/components/admin/session';

/**
 * A site's own admin, on its own domain: the same pages as this site's admin (re-exported here),
 * talking to the API through the domain's /api pass-through, so everything it does is that site's.
 */
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true },
};

export default function SiteAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      {children}
    </AdminSessionProvider>
  );
}
