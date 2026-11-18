'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CloudUpload, DatabaseBackup, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPlatformHost } from '@/lib/admin/api';
import { useAdmin } from '@/components/admin/session';
import { formatDateTime } from '@/components/admin/ui';

type BackupStatus = {
  isSetUp: boolean;
  lastAttemptAt: string | null;
  isLastAttemptOk: boolean;
  lastAttemptMessage: string;
  lastGoodAt: string | null;
  lastGoodBytes: number;
  collections: number;
  documents: number;
  isOffsiteConfigured: boolean;
  offsiteAt: string | null;
  isOffsiteOk: boolean;
  offsiteMessage: string;
  offsiteCopies: number;
};

/** A nightly backup that is more than this old means a night was missed. */
const STALE_HOURS = 36;

const hoursSince = (iso: string | null) => (iso ? (Date.now() - Date.parse(iso)) / 3_600_000 : Infinity);

function ago(iso: string | null) {
  const h = hoursSince(iso);
  if (!Number.isFinite(h)) return 'never';
  if (h < 1) return 'under an hour ago';
  if (h < 48) return `${Math.floor(h)} h ago`;
  return `${Math.floor(h / 24)} days ago`;
}

const size = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toLocaleString('en-IN', { maximumFractionDigits: 1 })} MB`;

function Line({ icon: Icon, isWarning, children }: { icon: typeof DatabaseBackup; isWarning: boolean; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 text-sm">
      <Icon aria-hidden className={cn('mt-0.5 h-4 w-4 shrink-0', isWarning ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--sys-green))]')} />
      <span>{children}</span>
    </p>
  );
}

/**
 * The site's health on the dashboard, on the main site only: when the last backup passed its
 * restore check, whether the offsite copy is verified, and browser errors waiting in Errors.
 */
export function SiteHealth() {
  const { call } = useAdmin();
  const [backup, setBackup] = useState<BackupStatus | null>(null);
  const [errorKinds, setErrorKinds] = useState(0);

  useEffect(() => {
    if (!isPlatformHost()) return;
    call<BackupStatus>('GetBackupStatus').then(setBackup).catch(() => {});
    call<unknown[]>('GetClientErrors').then((list) => setErrorKinds(list.length)).catch(() => {});
  }, [call]);

  if (!backup?.isSetUp && errorKinds === 0) return null;

  const isBackupStale = hoursSince(backup?.lastGoodAt ?? null) > STALE_HOURS;
  const isLastFailed = Boolean(backup?.lastAttemptAt) && !backup?.isLastAttemptOk;

  return (
    <section className="glass space-y-2 p-5" aria-label="Site health">
      {backup?.isSetUp && (
        <>
          <Line icon={DatabaseBackup} isWarning={isBackupStale || isLastFailed}>
            {backup.lastGoodAt ? (
              <>
                <span className="font-semibold">Last good backup {ago(backup.lastGoodAt)}</span> ({formatDateTime(backup.lastGoodAt)}): restored in a
                throwaway database with {backup.collections} collections and {backup.documents.toLocaleString('en-IN')} documents, {size(backup.lastGoodBytes)}.
              </>
            ) : (
              <span className="font-semibold">No backup has passed its restore check yet.</span>
            )}
            {isLastFailed && <> Last attempt {formatDateTime(backup.lastAttemptAt)}: {backup.lastAttemptMessage}</>}
            {!isLastFailed && isBackupStale && backup.lastGoodAt && <> Over {STALE_HOURS} hours old: check the mongo-backup service.</>}
          </Line>
          <Line icon={CloudUpload} isWarning={!backup.isOffsiteConfigured || !backup.isOffsiteOk}>
            {!backup.offsiteAt ? (
              'Offsite copy: no run recorded yet.'
            ) : !backup.isOffsiteConfigured ? (
              'Offsite copy: not set up, so the backups live only on this server. Add the OFFSITE_* settings in Coolify.'
            ) : backup.isOffsiteOk ? (
              <>Offsite copy verified {ago(backup.offsiteAt)}: {backup.offsiteCopies} encrypted dumps in the bucket.</>
            ) : (
              <>Offsite copy {formatDateTime(backup.offsiteAt)}: {backup.offsiteMessage}</>
            )}
          </Line>
        </>
      )}
      {errorKinds > 0 && (
        <Line icon={TriangleAlert} isWarning>
          {errorKinds} {errorKinds === 1 ? 'kind of script error' : 'kinds of script error'} in visitors&apos; browsers.{' '}
          <Link href="/admin/errors" className="font-medium text-primary hover:underline">See them</Link>.
        </Line>
      )}
    </section>
  );
}
