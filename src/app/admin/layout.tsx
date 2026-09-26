import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminSessionProvider } from '@/components/admin/session';

// The admin UI is a static shell; everything it shows comes from the API
// after sign-in. It is never indexed and never tracked (see TrackingBeacon).
export const metadata: Metadata = {
  title: 'Admin — dhucar.in',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <div className="container mx-auto max-w-6xl px-4 md:px-6 pt-8 lg:pt-32 pb-16">{children}</div>
    </AdminSessionProvider>
  );
}
