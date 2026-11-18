'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw, Trash2 } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { Notice, Panel, Spinner, dangerButton, formatDateTime, secondaryButton } from '@/components/admin/ui';

type ClientError = {
  id: string;
  message: string;
  source: string;
  line: number;
  column: number;
  stack: string;
  page: string;
  look: string;
  browser: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
};

/**
 * Script errors visitors' browsers hit on the public site, grouped by message and the place in the
 * code, newest first. Nothing identifies a visitor: no IP, cookie or id, and emails, long numbers
 * and query strings are masked before they are stored. Groups not seen for 90 days drop off.
 */
function ErrorList() {
  const { call } = useAdmin();
  const [errors, setErrors] = useState<ClientError[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setErrors(await call<ClientError[]>('GetClientErrors'));
      setLoadError('');
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const clear = async (id: string) => {
    if (!id && !window.confirm('Clear every error in the list?')) return;
    setBusy(id || 'all');
    setNotice(null);
    try {
      await call('ClearClientErrors', { id });
      setNotice({ kind: 'success', text: id ? 'Marked as fixed. It comes back here if it happens again.' : 'List cleared.' });
      await load();
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy('');
    }
  };

  if (loadError) return <Notice>{loadError}</Notice>;
  if (errors === null) return <Spinner />;

  const total = errors.reduce((sum, e) => sum + e.count, 0);

  return (
    <Panel
      title={errors.length === 0 ? 'No errors' : `${errors.length} ${errors.length === 1 ? 'kind' : 'kinds'} of error, ${total} ${total === 1 ? 'report' : 'reports'}`}
      description="Uncaught script errors from visitors' browsers on the public site, newest first. Mark one fixed once the fix is live; it returns here if it happens again."
      actions={
        <>
          <button type="button" className={secondaryButton} onClick={() => load()} disabled={busy !== ''}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {errors.length > 0 && (
            <button type="button" className={dangerButton} onClick={() => clear('')} disabled={busy !== ''}>
              <Trash2 className="h-4 w-4" /> Clear all
            </button>
          )}
        </>
      }
    >
      {notice && (
        <div className="mb-4">
          <Notice kind={notice.kind}>{notice.text}</Notice>
        </div>
      )}
      {errors.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing has gone wrong in a visitor&apos;s browser lately.</p>
      ) : (
        <ul className="space-y-3">
          {errors.map((e) => (
            <li key={e.id} className="glass-inset rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-mono text-sm font-semibold">{e.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{e.count}×</span> · last {formatDateTime(e.lastSeen)} on <span className="font-mono">{e.page}</span>
                    {e.look && <> · {e.look}</>}
                    {e.browser && <> · {e.browser}</>}
                    {e.source && (
                      <>
                        {' '}· <span className="font-mono">{e.source}{e.line ? `:${e.line}:${e.column}` : ''}</span>
                      </>
                    )}
                    {' '}· first {formatDateTime(e.firstSeen)}
                  </p>
                </div>
                <button type="button" className={secondaryButton} onClick={() => clear(e.id)} disabled={busy !== ''}>
                  <Check className="h-4 w-4" /> {busy === e.id ? 'Clearing…' : 'Mark fixed'}
                </button>
              </div>
              {e.stack && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-primary">Stack</summary>
                  <pre tabIndex={0} className="mt-2 overflow-x-auto rounded-lg bg-foreground/[0.04] p-3 font-mono text-xs leading-relaxed">{e.stack}</pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default function ErrorsPage() {
  return (
    <AdminShell title="Errors">
      <ErrorList />
    </AdminShell>
  );
}
